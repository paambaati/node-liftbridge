import { credentials as Credentials, ChannelCredentials, ClientReadableStream, ServiceError } from 'grpc';
import { APIClient } from '../grpc/generated/api_grpc_pb';
import { SubscribeRequest, Message, CreateStreamRequest, CreateStreamResponse, PublishResponse, PublishRequest, FetchMetadataRequest, FetchMetadataResponse } from '../grpc/generated/api_pb';
import LiftbridgeStream from './stream';
import LiftbridgeMessage from './message';

export default class LiftbridgeClient {
    private client: APIClient;

    constructor(address: string, credentials?: ChannelCredentials, options?: object) {
        this.client = new APIClient(address, credentials || Credentials.createInsecure(), options);
    }

    private createStreamRequest(stream: LiftbridgeStream): Promise<CreateStreamResponse> {
        return new Promise((resolve, reject) => {
            const createRequest = new CreateStreamRequest();
            if (stream.group) createRequest.setGroup(stream.group);
            if (stream.partitions) createRequest.setPartitions(stream.partitions);
            createRequest.setName(stream.name);
            createRequest.setSubject(stream.subject);
            createRequest.setReplicationfactor(stream.replicationFactor);
            this.client.createStream(createRequest, (err: ServiceError | null, response: CreateStreamResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    private createSubscribeRequest(stream: LiftbridgeStream): ClientReadableStream<Message> {
        const subscribeRequest = new SubscribeRequest();
        subscribeRequest.setStream(stream.name);
        subscribeRequest.setStartposition(stream.startPosition);
        if (stream.startOffset) {
            subscribeRequest.setStartoffset(stream.startOffset);
            return this.client.subscribe(subscribeRequest);
        } else if (stream.startTimestamp) {
            subscribeRequest.setStarttimestamp(stream.startTimestamp);
            return this.client.subscribe(subscribeRequest);
        }
        return this.client.subscribe(subscribeRequest);
    }

    private createPublishRequest(message: LiftbridgeMessage): Promise<PublishResponse> {
        return new Promise((resolve, reject) => {
            const publishRequest = new PublishRequest();
            publishRequest.setMessage(message);
            this.client.publish(publishRequest, (err: ServiceError | null, response: PublishResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    private createMetadataRequest(streamName: string): Promise<FetchMetadataResponse> {
        return new Promise((resolve, reject) => {
            const metadataRequest = new FetchMetadataRequest();
            metadataRequest.addStreams(streamName);
            this.client.fetchMetadata(metadataRequest, (err: ServiceError | null, response: FetchMetadataResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    public createStream(stream: LiftbridgeStream) {
        return this.createStreamRequest(stream);
    }

    public subscribe(stream: LiftbridgeStream) {
        const subscription = this.createSubscribeRequest(stream);
        return subscription;
    }

    public publish(message: LiftbridgeMessage) {
        const publisher = this.createPublishRequest(message);
        return publisher;
    }

    public async fetchMetadata(stream: LiftbridgeStream) {
        const metadataFetcher = this.createMetadataRequest(stream.name);
        return metadataFetcher;
    }
}
