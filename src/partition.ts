import { crc32 } from 'rapid-crc';
import { ILiftbridgeMetadata } from './metadata';
import LiftbridgeStream from './stream';
import LiftbridgeMessage from './message';
import { StreamNotFoundInMetadataError } from './errors';

export abstract class Partitioner {
    protected readonly message: LiftbridgeMessage;
    protected readonly stream: LiftbridgeStream;
    protected readonly metadata: ILiftbridgeMetadata;

    constructor(message: LiftbridgeMessage, stream: LiftbridgeStream, metadata: ILiftbridgeMetadata) {
        this.message = message;
        this.stream = stream;
        this.metadata = metadata;
    }

    protected getPartitionCount(): number {
        const streamMeta = this.metadata.metadataList.find(s => s && s.name === this.stream.name);
        if (!streamMeta) {
            throw new StreamNotFoundInMetadataError();
        }
        const partitionsCount = streamMeta.partitionsMap.length;
        return partitionsCount;
    }

    public abstract partition(): number;
}

/**
 * `KeyPartitioner` computes the partition number for a given message by hashing the
 * key and modding by the number of partitions for the first stream found with
 * the subject of the message. This does not work with streams containing
 * wildcards in their subjects, e.g. "foo.*", since this matches on the subject
 * literal of the published message. This also has undefined behavior if there
 * are multiple streams for the given subject.
 *
 * @param stream Stream to partition.
 * @param metadata Stream metadata.
 */
export class KeyPartitioner extends Partitioner {
    public partition(): number {
        let key = this.message.getKey();
        if (!key) key = Buffer.from('');
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount === 0) return 0;
        return crc32(key) % partitionsCount;
    }
}

/**
 * `RoundRobinPartitioner` computes the partition number for a given message
 * in a round-robin fashion by atomically incrementing a counter for the message
 * subject and modding by the number of partitions for the first stream found
 * with the subject. This does not work with streams containing wildcards in
 * their subjects, e.g. "foo.*", since this matches on the subject literal of
 * the published message. This also has undefined behavior if there are multiple
 * streams for the given subject.
 *
 * @param stream Stream to partition.
 * @param metadata Stream metadata.
 */
export class RoundRobinPartitioner extends Partitioner {
    public partition(): number {
        const subjectCounterMap: Map<string, number> = new Map(); // TODO: Move this into a class as a instance property.
        let key = this.message.getKey();
        if (!key) key = Buffer.from('');
        let counter = 0;
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount === 0) return 0;
        if (subjectCounterMap.has(this.stream.subject)) {
            counter = <number>subjectCounterMap.get(this.stream.subject);
            subjectCounterMap.set(this.stream.subject, counter++);
        } else {
            subjectCounterMap.set(this.stream.subject, counter);
        }
        return counter % partitionsCount;
    }
}
