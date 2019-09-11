import * as Debug from 'debug';
import { ServiceError } from 'grpc';
import { APIClient } from '../grpc/generated/api_grpc_pb';
import { FetchMetadataRequest, FetchMetadataResponse } from '../grpc/generated/api_pb';
import {
    NoSuchPartitionError, NoKnownPartitionError, NoKnownLeaderForPartitionError, SubjectNotFoundInMetadataError,
} from './errors';
import { faultTolerantCall } from './utils';

const debug = Debug.debug('node-liftbridge:metadata');

const DEFAULTS = {
    waitForSubjectMetadataRetryConfig: {
        numOfAttempts: 3,
        startingDelay: 0,
        timeMultiple: 1,
    },
};

/**
 * Metadata interface.
 */
export interface IMetadata {
    /**
     * List of brokers and their information.
     */
    brokers: {
        [brokerId: string]: IBrokerInfo,
    };
    /**
     * List of addresses.
     */
    addresses: {
        [address: string]: object,
    };
    /**
     * Stream metadata by name and subject.
     */
    streams: IStreamIndex;
    /**
     * Last updated timestamp.
     */
    lastUpdated: Date;
}

/**
 * Stream information interface.
 */
interface IStreamInfo {
    /**
     * Stream subject.
     */
    subject: string;
    /**
     * Stream name.
     */
    name: string;
    /**
     * Partition IDs and their information.
     */
    partitions: {
        [partitionId: number]: IPartitionInfo,
    };
}

/**
 * Stream index interface.
 */
interface IStreamIndex {
    /**
     * Stream information by name.
     */
    byName: {
        [name: string]: IStreamInfo,
    };
    /**
     * Stream information by subject.
     */
    bySubject: {
        [subject: string]: IStreamInfo,
    };
}

/**
 * Partition information interface.
 */
interface IPartitionInfo {
    /**
     * Partition ID.
     */
    id: number;
    /**
     * Partition leader.
     */
    leader: IBrokerInfo;
    /**
     * Partition replicas.
     */
    replicas: IBrokerInfo[];
    /**
     * Partition's in-sync replica(s).
     */
    isr: IBrokerInfo[];
}

/**
 * Broker information interface.
 */
interface IBrokerInfo {
    /**
     * Unique broker ID.
     */
    id: string;
    /**
     * Broker hostname.
     */
    host: string;
    /**
     * Broker port.
     */
    port: number;
}

export default class LiftbridgeMetadata {
    private readonly client: APIClient;

    private metadata: IMetadata;

    /**
     * Metadata class.
     *
     * Holds all metadaata of brokers, streams & partitions.
     * @param client Liftbridge client instance.
     * @param metadataResponse `MetadataResponse` gRPC object.
     */
    constructor(client: APIClient, metadataResponse: FetchMetadataResponse) {
        this.client = client;
        this.metadata = LiftbridgeMetadata.build(metadataResponse);
    }

    // Turn the MetadataResponse into a neatly readable and parse-able native JSON object.
    private static build(metadataResponse: FetchMetadataResponse): IMetadata {
        const latestMetadata: IMetadata = {
            brokers: {},
            addresses: {},
            streams: {
                byName: {},
                bySubject: {},
            },
            lastUpdated: new Date(),
        };
        const brokersList = metadataResponse.getBrokersList().map(_ => _.toObject());
        const metadataList = metadataResponse.getMetadataList().map(_ => _.toObject());
        brokersList.forEach(broker => {
            latestMetadata.brokers[broker.id] = {
                id: broker.id,
                host: broker.host,
                port: broker.port,
            };
        });

        let partitions: IPartitionInfo[] = [];
        metadataList.forEach(meta => {
            meta.partitionsMap.forEach(_partitionMap => {
                const thisPartition = _partitionMap[1];
                partitions.push({
                    id: thisPartition.id,
                    leader: latestMetadata.brokers[thisPartition.leader],
                    replicas: thisPartition.replicasList.map(_ => latestMetadata.brokers[_]),
                    isr: thisPartition.isrList.map(_ => latestMetadata.brokers[_]),
                });
            });
            const streamInfo: IStreamInfo = {
                subject: meta.subject,
                name: meta.name,
                partitions,
            };
            latestMetadata.streams.byName[meta.name] = streamInfo;
            latestMetadata.streams.bySubject[meta.subject] = streamInfo;
            latestMetadata.lastUpdated = new Date();
            partitions = [];
        });
        // TODO: figure out how to implement newMetadata.addresses
        return latestMetadata;
    }

    private async fetchMetadata(streams?: string[]): Promise<FetchMetadataResponse> {
        return new Promise((resolve, reject) => {
            const metadataRequest = new FetchMetadataRequest();
            if (streams && streams.length) {
                streams.forEach(metadataRequest.addStreams);
            }
            this.client.fetchMetadata(metadataRequest, (err: ServiceError | null, response: FetchMetadataResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    // Wait for subject metadata to appear until 3 metadata fetch calls.
    private async waitForSubjectMetadata(subject: string): Promise<IStreamInfo> {
        if (this.hasSubjectMetadata(subject)) return Promise.resolve(this.metadata.streams.bySubject[subject]);
        try {
            const metadata = await faultTolerantCall(this.update, DEFAULTS.waitForSubjectMetadataRetryConfig);
            return metadata.streams.bySubject[subject];
        }
        catch (e) {
            throw new SubjectNotFoundInMetadataError();
        }
    }

    private static constructAddress(host: string, port: number): string {
        return `${host}:${port}`;
    }

    /**
     * `getPartitionsCountForSubject` returns a map containing stream names
     * and the number of partitions for the stream. This does not match on
     * wildcard subjects, e.g. "foo.*".
     *
     * @param subject Subject to fetch partitions count for.
     */
    public async getPartitionsCountForSubject(subject: string): Promise<number> {
        const subjectMeta = this.metadata.streams.bySubject[subject];
        if (!subjectMeta) {
            const freshSubjectMeta = await this.waitForSubjectMetadata(subject);
            return Object.keys(freshSubjectMeta.partitions).length;
        } else {
            return Object.keys(subjectMeta.partitions).length;
        }
    }

    /**
     * `hasSubjectMetadata` indicates if the Metadata has info for at
     * least one stream with the given subject literal.
     *
     * @param subject Subject to check metadata for.
     */
    public hasSubjectMetadata(subject: string): boolean {
        return !!this.metadata.streams.bySubject[subject];
    }

    /**
     * `update` fetches the latest cluster metadata, including stream
     * and broker information.
     *
     * @returns Metadata.
     */
    public async update(): Promise<IMetadata> {
        debug('attempting to update metadata');
        const metadataResponse = await this.fetchMetadata();
        this.metadata = LiftbridgeMetadata.build(metadataResponse);
        return this.metadata;
    }

    /**
     * `get` returns the cluster metadata.
     *
     * @returns Metadata.
     */
    public get(): IMetadata {
        return this.metadata;
    }

    /**
     * `getAddr` returns the broker address for the given stream partition.
     *
     * @param stream Stream.
     * @param partition Stream partition.
     * @returns Broker address.
     */
    public getAddress(stream: string, partition: number): string {
        const streamMetadata = this.metadata.streams.byName[stream];
        if (!streamMetadata) throw new NoSuchPartitionError();
        const partitionMetadata = streamMetadata.partitions[partition];
        if (!partitionMetadata) throw new NoKnownPartitionError();
        const { leader } = partitionMetadata;
        if (!leader) throw new NoKnownLeaderForPartitionError();
        return LiftbridgeMetadata.constructAddress(leader.host, leader.port);
    }
}
