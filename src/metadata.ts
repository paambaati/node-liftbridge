import { APIClient } from '../grpc/generated/api_grpc_pb';
import { FetchMetadataRequest, FetchMetadataResponse } from '../grpc/generated/api_pb';
import { StreamNotFoundInMetadataError } from './errors';
import { ServiceError } from 'grpc';

// Own interfaces.
export interface IMetadata {
    brokers: {
        [brokerId: string]: IBrokerInfo,
    };
    addresses: {
        [address: string]: object,
    };
    streams: IStreamIndex;
    lastUpdated: Date;
}

interface IStreamInfo {
    subject: string;
    name: string;
    partitions: {
        [partitionId: number]: IPartitionInfo,
    };
}

interface IStreamIndex {
    byName: {
        [name: string]: IStreamInfo,
    };
    bySubject: {
        [subject: string]: IStreamInfo,
    };
}

interface IPartitionInfo {
    id: number;
    leader: IBrokerInfo;
    replicas: IBrokerInfo[];
    isr: IBrokerInfo[];
}

interface IBrokerInfo {
    id: string;
    host: string;
    port: number;
}

// gRPC post-deserialization interfaces.
export interface ILiftbridgeMetadata {
    brokersList: ILiftbridgeBrokersList[];
    metadataList: ILiftbridgeMetadataList[];
}

interface ILiftbridgeBrokersList {
    id: string;
    host: string;
    port: number;
}

interface ILiftbridgeMetadataList {
    name: string;
    subject: string;
    error: number;
    partitionsMap: Array<Array<ILiftbridgePartitionMetadata | number>>;
}

interface ILiftbridgePartitionMetadata {
    id: number;
    leader: string;
    replicasList: string[];
    isrList: string[];
}

export default class LiftbridgeMetadata {
    private readonly client: APIClient;
    private metadata: IMetadata;

    constructor(client: APIClient, metadataResponse: FetchMetadataResponse) {
        this.client = client;
        this.metadata = this.build(metadataResponse);
    }

    private build(metadataResponse: FetchMetadataResponse): IMetadata {
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
            }
            latestMetadata.streams.byName[meta.name] = streamInfo;
            latestMetadata.streams.bySubject[meta.subject] = streamInfo;
            latestMetadata.lastUpdated = new Date();
            partitions = [];
        });
        // TODO: figure out how to implement newMetadata.addresses
        // TODO: THen also implement getAddrs()/getAddr()
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

    /**
     * `getPartitionsCountForSubject` returns a map containing stream names
     * and the number of partitions for the stream. This does not match on
     * wildcard subjects, e.g. "foo.*".
     *
     * @param subject Subject to fetch partitions count for.
     */
    public getPartitionsCountForSubject(subject: string): number {
        const subjectMeta = this.metadata.streams.bySubject[subject];
        if (!subjectMeta) throw new StreamNotFoundInMetadataError();
        return Object.keys(subjectMeta.partitions).length;
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
     */
    public async update(): Promise<IMetadata> {
        const metadataResponse = await this.fetchMetadata();
        this.metadata = this.build(metadataResponse);
        return this.metadata;
    }

    public get(): IMetadata {
        return this.metadata;
    }
}
