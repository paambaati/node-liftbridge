import Debug from 'debug';
import { ServiceError } from 'grpc';
import { APIClient } from '../grpc/generated/api_grpc_pb';
import { FetchMetadataRequest, FetchMetadataResponse } from '../grpc/generated/api_pb';
import {
    NoSuchPartitionError, NoKnownPartitionError, NoKnownLeaderForPartitionError, SubjectNotFoundInMetadataError,
} from './errors';
import { faultTolerantCall, constructAddress } from './utils';

const debug = Debug.debug('node-liftbridge:metadata');

const DEFAULTS = { // TODO: look at how to expose this.
    metadataUpdateRetryConfig: {
        numOfAttempts: 15,
        startingDelay: 200,
    },
    waitForSubjectMetadataUntil: 30000,
    hostname: '127.0.0.1',
};

/**
 * Metadata interface.
 *
 * @category Metadata
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
 *
 * @category Metadata
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
 * Holds all the streams by name and subject for easy lookups.
 *
 * @category Metadata
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
 *
 * @category Metadata
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
 *
 * @category Metadata
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

/**
 * Liftbridge stream & partition metadata.
 *
 * Includes useful methods to fetch/refresh Liftbridge metadata and convert
 * them into usable JSON objects.
 *
 * @category Metadata
 */
export default class LiftbridgeMetadata {
    private readonly client: APIClient;

    private metadata: IMetadata;

    /**
     * Metadata class.
     *
     * Holds all metadata of brokers, streams & partitions.
     * @param client Liftbridge client instance.
     * @param metadataResponse `MetadataResponse` gRPC object.
     */
    constructor(client: APIClient, metadataResponse: FetchMetadataResponse = new FetchMetadataResponse()) {
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
                host: broker.host || DEFAULTS.hostname,
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

    private fetchMetadata(streams?: string[]): Promise<FetchMetadataResponse> {
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

    // Wait for subject metadata to appear until `DEFAULTS.waitForSubjectMetadataUntil`.
    private async waitForSubjectMetadata(subject: string): Promise<IStreamInfo> {
        return new Promise(async (resolve, reject) => {
            if (this.hasSubjectMetadata(subject)) return resolve(this.metadata.streams.bySubject[subject]);
            debug('metadata not found for subject', subject, 'so going to wait');
            const start = process.hrtime();
            let wait = true;
            const waiter = setTimeout(() => {
                wait = false;
            }, DEFAULTS.waitForSubjectMetadataUntil);
            while (wait) {
                const metadata = await this.update(); // Keep updating and then checking for subject metadata to appear.
                if (this.hasSubjectMetadata(subject)) {
                    const end = process.hrtime(start);
                    const ms = (end[0] * 1e9 + end[1]) / 1e6;
                    debug('metadata for subject', subject, 'found after', ms, 'milliseconds');
                    waiter.unref();
                    return resolve(metadata.streams.bySubject[subject]);
                }
            }
            return reject(new SubjectNotFoundInMetadataError());
        });
    }

    /**
     * Returns a map containing stream names and the number
     * of partitions for the stream. This does not match on
     * wildcard subjects, e.g. "foo.*".
     *
     * @param subject Subject to fetch partitions count for.
     * @returns total partitions for the subject.
     */
    public async getPartitionsCountForSubject(subject: string): Promise<number> {
        const subjectMeta = this.metadata.streams.bySubject[subject];
        if (!subjectMeta) {
            const freshSubjectMeta = await this.waitForSubjectMetadata(subject);
            return Object.keys(freshSubjectMeta.partitions).length;
        }
        return Object.keys(subjectMeta.partitions).length;
    }

    /**
     * Indicates if the Metadata has info for at
     * least one stream with the given subject.
     *
     * @param subject Subject to check metadata for.
     * @returns `true` if metadata was found for subject, or `false` otherwise.
     */
    public hasSubjectMetadata(subject: string): boolean {
        return !!this.metadata.streams.bySubject[subject];
    }

    /**
     * Fetches the latest cluster metadata, including stream
     * and broker information. Also updates the local copy of metadata.
     *
     * @param streams Stream(s) to fetch metadata for.
     * @returns Metadata.
     */
    public async update(streams: string | string[] = []): Promise<IMetadata> {
        const streamsToUpdate = (typeof streams === 'string') ? [ streams ] : streams;
        const metadataResponse = await faultTolerantCall(() => this.fetchMetadata(streamsToUpdate), DEFAULTS.metadataUpdateRetryConfig);
        this.metadata = LiftbridgeMetadata.build(metadataResponse);
        return this.metadata;
    }

    /**
     * Returns the cluster metadata.
     *
     * @returns Metadata.
     */
    public get(): IMetadata {
        return this.metadata;
    }

    /**
     * Returns the broker address for the given stream partition.
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
        return constructAddress(leader.host, leader.port);
    }
}
