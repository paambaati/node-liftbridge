import { StartPosition, StartPositionMap } from '../grpc/generated/api_pb';

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
    public constructor({ subject, name, group, replicationFactor = 1, maxReplication = false, startOffset, startTimestamp, partitions }: { subject: string; name: string; group?: string; replicationFactor?: number; maxReplication?: boolean; startOffset?: number; startTimestamp?: number; partitions?: number}) {
        this.subject = subject;
        this.name = name;
        if (group) this.group = group;
        this.replicationFactor = maxReplication ? replicationFactor = -1 : replicationFactor;
        this.maxReplication = maxReplication;
        if (startOffset) this.startOffset = startOffset;
        if (startTimestamp) this.startTimestamp = startTimestamp;
        this.startPosition = StartPosition.EARLIEST;
    }
}
