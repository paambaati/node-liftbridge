import { readFileSync } from 'fs';
import { IBackOffOptions } from 'exponential-backoff/dist/options';
import Bluebird from 'bluebird';
import Debug from 'debug';
import {
    Client as GRPCClient,
    credentials as GRPCCredentials,
    ChannelCredentials,
    ClientReadableStream,
    ServiceError,
    status,
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
    StartPosition,
} from '../grpc/generated/api_pb';
import LiftbridgeStream from './stream';
import LiftbridgeMessage from './message';
import LiftbridgeMetadata from './metadata';
import {
    NoAddressesError, CouldNotConnectToAnyServerError, PartitionAlreadyExistsError, DeadlineExceededError,
} from './errors';
import { shuffleArray, faultTolerantCall } from './utils';
import { builtinPartitioners, PartitionerLike } from './partition';

/**
 * @hidden
 */
const debug = Debug.debug('node-liftbridge:client');

/**
 * @hidden
 */
const DEFAULTS = {
    timeout: 5000,
};

/**
 * Liftbridge gRPC credentials.
 *
 * Read [`grpc #273`](https://github.com/grpc/grpc-node/issues/273#issuecomment-399506158) for more details.
 *
 * @category Client
 */
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

/**
 * Create a client for working with a Liftbridge cluster.
 *
 * @example Insecure connection (default).
 * ```
 * import LiftbridgeClient from 'liftbridge';
 *
 * const client = new LiftbridgeClient('localhost:9292');
 * await client.connect();
 * ```
 *
 * @example Secure TLS connection (recommended in production).
 * ```
 * import LiftbridgeClient from 'liftbridge';
 *
 * const client = new LiftbridgeClient('localhost:9292', {
 *      rootCertificateFile: './credentials/ca.crt',
 *      privateKeyFile: './credentials/private.key',
 *      certificateChainFile: './credentials/chain.crt'
 * });
 * await client.connect();
 * ```
 * @category Client
 */
export default class LiftbridgeClient {
    private addresses: string[];

    private options?: object;

    private credentials: ChannelCredentials;

    private client!: APIClient;

    private metadata!: LiftbridgeMetadata;

    /**
     * A client for use with a Liftbridge cluster.
     *
     * @param addresses String or array of strings of Liftbridge server addresses to connect to.
     * @param serverCredentials TLS credentials to use. Defaults to insecure context.
     * @param options Additional [options](https://grpc.github.io/grpc/core/group__grpc__arg__keys.html) to pass on to low-level gRPC client for channel creation.
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

    // Deadline is always UNIX epoch time + milliseconds in the future when you want the deadline to expire.
    private static getDeadline(timeout: number = DEFAULTS.timeout) {
        return new Date().getTime() + timeout;
    }

    // Make a fault-tolerant connection to the Liftbridge server.
    private connectToLiftbridge(address: string, timeout?: number, options?: Partial<IBackOffOptions>): Promise<APIClient> {
        return faultTolerantCall(() => new Promise((resolve, reject) => {
            debug('attempting connection to', address);
            const connection = new GRPCClient(address, this.credentials, this.options);
            // `waitForReady` takes a deadline.
            connection.waitForReady(LiftbridgeClient.getDeadline(timeout), err => {
                if (err) return reject(err);
                debug('remote client connected and ready at', address);
                this.client = new APIClient(address, this.credentials, {
                    channelOverride: connection.getChannel(), // Reuse the working channel for APIClient.
                });
                return resolve(this.client);
            });
        }), options);
    }

    // Find partition for the Message subject.
    private async findPartition(message: LiftbridgeMessage): Promise<number> {
        const subject = message.getSubject();
        const totalPartitions = await this.metadata.getPartitionsCountForSubject(subject);
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
        debug('calculated partition for message on subject', subject, partition);
        return partition;
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
            this.client.createStream(createRequest, { deadline: LiftbridgeClient.getDeadline() }, (err: ServiceError | null, response: CreateStreamResponse | undefined) => {
                if (err) {
                    debug('create stream failed! error code =', err.code);
                    if (err.code === status.ALREADY_EXISTS) return reject(new PartitionAlreadyExistsError());
                    if (err.code === status.DEADLINE_EXCEEDED) return reject(new DeadlineExceededError());
                    return reject(err);
                }
                debug('create stream successful');
                return this.metadata.update(stream.name) // Stream created. Now update metadata to make sure we know about the newly created stream.
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
        // TODO: Subscribe requests must be sent to the leader of the requested stream partition - see https://github.com/liftbridge-io/liftbridge/blob/client_documentation/documentation/client.md#metadata-implementation
        if (stream.startOffset) {
            debug('attempting to subscribe to stream', stream.name, 'at offset', stream.startOffset);
            subscribeRequest.setStartoffset(stream.startOffset.toString());
            return this.client.subscribe(subscribeRequest);
        } else if (stream.startTimestamp) {
            debug('attempting to subscribe to stream', stream.name, 'at timestamp', stream.startTimestamp);
            subscribeRequest.setStarttimestamp(stream.startTimestamp.toString());
            return this.client.subscribe(subscribeRequest);
        }
        debug('attempting to subscribe to stream', stream.name);
        return this.client.subscribe(subscribeRequest);
    }

    private createPublishRequest(message: LiftbridgeMessage): Promise<PublishResponse> {
        return new Promise(async (resolve, reject) => {
            const publishRequest = new PublishRequest();
            const subject = message.getSubject();
            const partition = await this.findPartition(message);
            const updatedSubject = (partition && partition > 0) ? `${subject}.${partition}` : subject;
            message.setSubject(updatedSubject);
            publishRequest.setMessage(message);
            debug('going to publish message to subject', updatedSubject, 'at partition', partition, 'with key', message.getKey().toString());
            this.client.publish(publishRequest, { deadline: LiftbridgeClient.getDeadline() }, (err: ServiceError | null, response: PublishResponse | undefined) => {
                if (err) {
                    if (err.code === status.DEADLINE_EXCEEDED) return reject(new DeadlineExceededError());
                    return reject(err);
                }
                return resolve(response);
            });
        });
    }

    /**
     * Establish a connection to the Liftbridge cluster.
     *
     * @example Connecting to a Liftbridge cluster with a custom timeout and multiple retries.
     *
     * ```
     * import LiftbridgeClient from 'liftbridge';
     *
     * const client = new LiftbridgeClient('localhost:9292');
     * await client.connect(3000, {
     *      delayFirstAttempt: true,
     *      jitter: 'full';
     *      numOfAttempts: 10,
     *      timeMultiple: 1.5,
     *      startingDelay: 250
     * });
     * ```
     *
     * @param timeout Milliseconds before the connection attempt times out. This is set as the [gRPC Deadline](https://grpc.io/blog/deadlines/).
     * @param retryOptions Retry & backoff options.
     * @returns Client instance.
     */
    public connect(timeout?: number, retryOptions?: Partial<IBackOffOptions>): Promise<APIClient> {
        return new Promise((resolve, reject) => {
            // Try connecting to each Liftbridge server in random order and use the first successful connection for APIClient.
            const connectionAttempts = shuffleArray(this.addresses).map(address => this.connectToLiftbridge(address, timeout, retryOptions));
            Bluebird.any(connectionAttempts).then(client => {
                this.client = client;
                // Client connection succeeded. Now collect broker & partition metadata for all streams.
                const metadata = new LiftbridgeMetadata(this.client);
                metadata.update().then(() => {
                    debug('initial cluster metadata fetch completed');
                    this.metadata = metadata;
                    return resolve(this.client);
                });
            }).catch(() => reject(new CouldNotConnectToAnyServerError()));
        });
    }

    /**
     * Create a new stream attached to a NATS subject. Subject is
     * the NATS subject the stream is attached to, and name is the stream
     * identifier, unique per subject. It throws [[PartitionAlreadyExistsError]] if a
     * stream with the given subject and name already exists.
     *
     * @example Create a new stream on the Liftbridge cluster.
     * ```
     * import LiftbridgeClient from 'liftbridge';
     *
     * const client = new LiftbridgeClient('localhost:9292');
     * await client.connect();
     * await client.createStream(new LiftbridgeStream({
     *      subject: 'my-subject',
     *      name: 'stream-name',
     *      partitions: 5,
     *      maxReplication: true
     * })).catch(err => {
     *      if (err.code !== ErrorCodes.ERR_PARTITION_ALREADY_EXISTS) {
     *          throw err;
     *      }
     * });
     * ```
     *
     * @param stream Stream to create.
     * @returns CreateStreamResponse gRPC object.
     */
    public createStream(stream: LiftbridgeStream): Promise<CreateStreamResponse> {
        return this.createStreamRequest(stream);
    }

    /**
     * Create an ephemeral subscription for the given stream. It begins
     * receiving messages starting at the configured position and waits
     * for new messages when it reaches the end of the stream. The default
     * start position is the end of the stream. It throws [[NoSuchPartitionError]]
     * if the given stream does not exist. Use `subscribe().close()` to close
     * a subscription.
     *
     * @example Subscribing to a subject.
     * ```
     * import LiftbridgeClient from 'liftbridge';
     * import LiftbridgeStream, { StartPosition } from 'liftbridge/stream';
     *
     * const client = new LiftbridgeClient('localhost:9292');
     * await client.connect();
     * const subscription = client.subscribe(new LiftbridgeStream({
     *      subject: 'my-subject',
     *      name: 'stream-name',
     *      startPosition: StartPosition.EARLIEST
     * }));
     *
     * subscription.on('data', (data: Message) => {
     *      console.log('subscribe on data = ', LiftbridgeMessage.toJSON(data));
     * });
     *
     * // When ready to finish subscription —
     * subscription.close();
     * ```
     *
     * @param stream Stream to subscribe to.
     * @event data On data from the subscribed Liftbridge stream.
     * @event status On gRPC process status.
     * @event error On some error.
     * @event end OnLiftbridge server finishing sending messages.
     * @returns `ReadableStream` of messages.
     */
    public subscribe(stream: LiftbridgeStream): ClientReadableStream<Message> {
        const subscription = this.createSubscribeRequest(stream);
        return subscription;
    }

    /**
     * Publish a new message to the NATS subject. If the AckPolicy is
     * not NONE and a deadline is provided, this will synchronously block until
     * the first ack is received. If the ack is not received in time, a
     * DeadlineExceeded status code is returned. If an AckPolicy and deadline
     * are configured, this returns the first Ack on success, otherwise it
     * returns null.
     *
     * @example Publish a message to a subject.
     * ```
     * import LiftbridgeClient from 'liftbridge';
     * import LiftbridgeMessage, { AckPolicy } from 'liftbridge/message';
     *
     * const client = new LiftbridgeClient('localhost:9292');
     * await client.connect();
     *
     * await client.publish(new LiftbridgeMessage({
     *      subject: 'my-subject',
     *      key: 'message-key',
     *      value: 'message-value',
     *      ackPolicy: AckPolicy.ALL,
     *      partitionStrategy: 'roundrobin',
     *      ackInbox: 'ack.my-subject',
     *      headers: { 'some-header': '123' }
     * }));
     * ```
     *
     * @param message Message to publish.
     * @returns PublishResponse gRPC object.
     */
    public publish(message: LiftbridgeMessage): Promise<PublishResponse> {
        const publisher = this.createPublishRequest(message);
        return publisher;
    }

    /**
     * Close the client connection to the Liftbridge cluster.
     */
    public close(): void {
        this.client.close();
    }
}

export {
    APIClient,
    IBackOffOptions,
    CreateStreamResponse,
    PublishResponse,
    ClientReadableStream,
    Message,
    StartPosition,
};
