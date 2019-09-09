import { readFileSync } from 'fs';
import { IBackOffOptions } from 'exponential-backoff/dist/options';
import Bluebird from 'bluebird';
import * as Debug from 'debug';
import {
    Client as GRPCClient,
    credentials as GRPCCredentials,
    ChannelCredentials,
    ClientReadableStream,
    ServiceError,
} from 'grpc';
import { APIClient } from '../grpc/generated/api_grpc_pb';
import {
    SubscribeRequest,
    Message,
    CreateStreamRequest,
    CreateStreamResponse,
    PublishResponse,
    PublishRequest,
    FetchMetadataRequest,
    FetchMetadataResponse,
} from '../grpc/generated/api_pb';
import LiftbridgeStream from './stream';
import LiftbridgeMessage from './message';
import LiftbridgeMetadata from './metadata';
import { NoAddressesError, CouldNotConnectToAnyServerError, PartitionAlreadyExistsError } from './errors';
import { shuffleArray, faultTolerantCall } from './utils';
import { builtinPartitioners, PartitionerLike } from './partition';

const debug = Debug.debug('node-liftbridge:client');

const DEFAULTS = {
    timeout: 5000,
};

export interface ICredentials {
    /**
     * Root certificate file.
     *
     * Usually something like `ca.crt`
     */
    rootCertificateFile?: string;
    /**
     * Client certificate private key file.
     *
     * Usually something like `<something>.key`
     */
    privateKeyFile: string;
    /**
     * Client certificate cert chain file.
     *
     * Usually something like `<something>.crt`
     */
    certificateChainFile: string;
}

export default class LiftbridgeClient {
    private addresses: string[];

    private options?: object;

    private credentials: ChannelCredentials;

    private client!: APIClient;

    private metadata!: LiftbridgeMetadata;

    /**
     * A simple client for use with a Liftbridge cluster.
     * Use `.connect()` to establish a first connection.
     *
     * @param addresses String or array of strings of Liftbridge server addresses to connect to.
     * @param credentials (Optional) Credentials to use. Defaults to insecure context.
     * @param options (Optional) [Additional options](https://grpc.github.io/grpc/core/group__grpc__arg__keys.html) to pass on to low-level gRPC client for channel creation.
     */
    constructor(addresses: string[] | string, serverCredentials: ICredentials | undefined = undefined, options?: object) {
        if (!addresses || addresses.length < 1) {
            throw new NoAddressesError();
        }
        this.addresses = Array.isArray(addresses) ? addresses : [addresses];
        this.credentials = LiftbridgeClient.loadCredentials(serverCredentials);
        this.options = options;
    }

    // Create gRPC channel credentials.
    private static loadCredentials(credentials: ICredentials | undefined): ChannelCredentials {
        if (!credentials) return GRPCCredentials.createInsecure();
        return GRPCCredentials.createSsl(
            credentials.rootCertificateFile ? readFileSync(credentials.rootCertificateFile) : undefined,
            credentials.privateKeyFile ? readFileSync(credentials.privateKeyFile) : undefined,
            credentials.certificateChainFile ? readFileSync(credentials.certificateChainFile) : undefined,
        );
    }

    // Make a fault-tolerant connection to the Liftbridge server.
    private connectToLiftbridge(address: string, timeout: number = DEFAULTS.timeout, options?: Partial<IBackOffOptions>): Promise<APIClient> {
        return faultTolerantCall(() => new Promise((resolve, reject) => {
            debug('attempting connection to', address);
            const connection = new GRPCClient(address, this.credentials, this.options);
            // `waitForReady` takes a deadline.
            // Deadline is always UNIX epoch time + milliseconds in the future when you want the deadline to expire.
            connection.waitForReady(new Date().getTime() + timeout, err => {
                debug('remote client connected and ready at ', address);
                if (err) return reject(err);
                this.client = new APIClient(address, this.credentials, {
                    channelOverride: connection.getChannel(), // Reuse the working channel for APIClient.
                });
                return resolve(this.client);
            });
        }), options);
    }

    // Find partition for the Message subject.
    private findPartition(message: LiftbridgeMessage): number {
        const subject = message.getSubject();
        const totalPartitions = this.metadata.getPartitionsCountForSubject(subject);
        let partition: number = 0;
        // Calculate partition for the message by using the relevant partitioning strategy.
        if (totalPartitions > 0) {
            if (message.partition) {
                ({ partition } = message);
            } else if (message.partitionStrategy) {
                let PartitionerConstructor: PartitionerLike;
                if (typeof message.partitionStrategy === 'string') {
                    PartitionerConstructor = builtinPartitioners[message.partitionStrategy];
                } else {
                    PartitionerConstructor = message.partitionStrategy;
                }
                partition = new PartitionerConstructor(subject, message.getKey(), this.metadata.get()).calculatePartition();
            }
        }
        return partition;
    }

    /**
     * Establish a connection to the Liftbridge cluster.
     *
     * @param timeout (Optional) Milliseconds before the connection attempt times out.
     * @param retryOptions (Optional) Retry & backoff options.
     * @returns Client instance.
     */
    public connect(timeout?: number, retryOptions?: Partial<IBackOffOptions>): Promise<APIClient> {
        return new Promise((resolve, reject) => {
            // Try connecting to each Liftbridge server in random order and use the first successful connection for APIClient.
            const connectionAttempts = shuffleArray(this.addresses).map(address => this.connectToLiftbridge(address, timeout, retryOptions));
            Bluebird.any(connectionAttempts).then(client => {
                this.client = client;
                // Client connection succeeded. Now collect broker & partition metadata for all streams.
                this.fetchMetadata().then(metadataResponse => {
                    debug('metadata fetch completed');
                    this.metadata = new LiftbridgeMetadata(this.client, metadataResponse);
                    return resolve(this.client);
                });
            }).catch(() => reject(new CouldNotConnectToAnyServerError()));
        });
    }

    private createStreamRequest(stream: LiftbridgeStream): Promise<CreateStreamResponse> {
        return new Promise((resolve, reject) => {
            const createRequest = new CreateStreamRequest();
            if (stream.group) createRequest.setGroup(stream.group);
            if (stream.partitions) createRequest.setPartitions(stream.partitions);
            createRequest.setName(stream.name);
            createRequest.setSubject(stream.subject);
            createRequest.setReplicationfactor(stream.replicationFactor);
            debug('attempting to create stream', stream.name, 'on subject', stream.subject);
            this.client.createStream(createRequest, (err: ServiceError | null, response: CreateStreamResponse | undefined) => {
                if (err) {
                    debug('create stream failed!');
                    if (err.code === 6) return reject(new PartitionAlreadyExistsError());
                    return reject(err);
                }
                debug('create stream successful');
                return this.metadata.update()
                    .then(() => resolve(response))
                    .catch(reject);
            });
        });
    }

    private createSubscribeRequest(stream: LiftbridgeStream): ClientReadableStream<Message> {
        const subscribeRequest = new SubscribeRequest();
        subscribeRequest.setStream(stream.name);
        if (stream.startPosition) subscribeRequest.setStartposition(stream.startPosition);
        // subscribeRequest.setPartition(0); // TODO: debug this - figure out how best to allow to set specific partition.
        if (stream.startOffset) {
            subscribeRequest.setStartoffset(stream.startOffset);
            return this.client.subscribe(subscribeRequest);
        } if (stream.startTimestamp) {
            subscribeRequest.setStarttimestamp(stream.startTimestamp);
            return this.client.subscribe(subscribeRequest);
        }
        return this.client.subscribe(subscribeRequest);
    }

    private createPublishRequest(message: LiftbridgeMessage): Promise<PublishResponse> {
        return new Promise((resolve, reject) => {
            const publishRequest = new PublishRequest();
            const subject = message.getSubject();
            const partition = this.findPartition(message);
            const updatedSubject = (partition && partition > 0) ? `${subject}.${partition}` : subject;
            message.setSubject(updatedSubject);
            publishRequest.setMessage(message);
            this.client.publish(publishRequest, (err: ServiceError | null, response: PublishResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    private createMetadataRequest(streams?: string[]): Promise<FetchMetadataResponse> {
        return new Promise((resolve, reject) => {
            const metadataRequest = new FetchMetadataRequest();
            if (streams && streams.length) {
                streams.forEach(stream => metadataRequest.addStreams(stream));
            }
            this.client.fetchMetadata(metadataRequest, (err: ServiceError | null, response: FetchMetadataResponse | undefined) => {
                if (err) return reject(err);
                return resolve(response);
            });
        });
    }

    private async fetchMetadata(streams?: LiftbridgeStream | LiftbridgeStream[]) {
        const streamNames: string[] = [];
        if (streams) {
            if (Array.isArray(streams)) {
                streams.forEach(stream => streamNames.push(stream.name));
            } else {
                streamNames.push(streams.name);
            }
        }
        const metadataFetcher = this.createMetadataRequest(streamNames);
        return metadataFetcher;
    }

    /**
     * `createStream` creates a new stream attached to a NATS subject. Subject is
     * the NATS subject the stream is attached to, and name is the stream
     * identifier, unique per subject. It throws `StreamAlreadyExistsError` if a
     * stream with the given subject and name already exists.
     *
     * @param stream Stream to create.
     * @returns CreateStreamResponse gRPC object.
     */
    public createStream(stream: LiftbridgeStream): Promise<CreateStreamResponse> {
        return this.createStreamRequest(stream);
    }

    /**
     * `subscribe` creates an ephemeral subscription for the given stream. It
     * begins receiving messages starting at the configured position and waits
     * for new messages when it reaches the end of the stream. The default
     * start position is the end of the stream. It throws a `NoSuchStreamError`
     * if the given stream does not exist. Use `subscribe().close()` to close
     * a subscription.
     *
     * @param stream Stream to subscribe to.
     * @returns ReadableStream of messages.
     */
    public subscribe(stream: LiftbridgeStream): ClientReadableStream<Message> {
        const subscription = this.createSubscribeRequest(stream);
        return subscription;
    }

    /**
     * `publish` publishes a new message to the NATS subject. If the AckPolicy is
     * not NONE and a deadline is provided, this will synchronously block until
     * the first ack is received. If the ack is not received in time, a
     * DeadlineExceeded status code is returned. If an AckPolicy and deadline
     * are configured, this returns the first Ack on success, otherwise it
     * returns null.
     *
     * @param message Message to publish.
     * @returns PublishResponse gRPC object.
     */
    public publish(message: LiftbridgeMessage): Promise<PublishResponse> {
        const publisher = this.createPublishRequest(message);
        return publisher;
    }

    /**
     * `close` closes the client connection to the Liftbridge cluster.
     */
    public close(): void {
        this.client.close();
    }
}
