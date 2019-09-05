import { StartPosition, StartPositionMap } from '../grpc/generated/api_pb';
import { InvalidPartitionsError } from './errors';

export interface ILiftbridgeStreamOptions {
    subject: string;
    name: string;
    /**
     * `group` is the name of a load-balance group. When there are multiple
	 * streams in the same group, messages will be balanced among them.
     */
    group?: string;
    /**
     * `replicationFactor` controls the number of servers to replicate a stream
	 * to. For example a value of `1` would mean only 1 server would have the data,
	 * and a value of `3` would be 3 servers would have it. If this is not set, it
	 * defaults to `1`. A value of `-1` will signal to the server to set the
	 * replication factor equal to the current number of servers in the
	 * cluster.
     */
    replicationFactor?: number;
    /**
     * `maxReplication` sets the stream replication factor equal
     * to the current number of servers in the cluster.
     */
    maxReplication?: boolean;
    startOffset?: number;
    startTimestamp?: number;
    /**
     * `partitions` determines how many partitions to create for a stream. If `0`,
	 * this will behave as a stream with a single partition. If this is not
	 * set, it defaults to `1`.
     */
    partitions?: number
}

export default class LiftbridgeStream {
    public readonly subject: string;
    public readonly name: string;
    public readonly group: string | undefined;
    public readonly replicationFactor: number;
    private readonly maxReplication: boolean;
    public startOffset: number | undefined;
    public startTimestamp: number | undefined;
    public startPosition: StartPositionMap[keyof StartPositionMap];
    public partitions: number | undefined;
    public constructor({ subject, name, group, replicationFactor = 1, maxReplication = false, startOffset, startTimestamp, partitions = 1 }: ILiftbridgeStreamOptions) {
        this.subject = subject;
        this.name = name;
        if (group) this.group = group;
        if (partitions < 0) {
            throw new InvalidPartitionsError();
        }
        this.partitions = partitions;
        this.replicationFactor = maxReplication ? replicationFactor = -1 : replicationFactor;
        this.maxReplication = maxReplication;
        if (startOffset) this.startOffset = startOffset;
        if (startTimestamp) this.startTimestamp = startTimestamp;
        this.startPosition = StartPosition.EARLIEST;
    }
}
