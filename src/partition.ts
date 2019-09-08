import fnv1a from '@sindresorhus/fnv1a';
import { IMetadata } from './metadata';
import LiftbridgeMessage from './message';
import { StreamNotFoundInMetadataError } from './errors';

const subjectCounter = (function() {
    const subjectCounterMap: Map<string, number> = new Map();
    return {
        add: function(key: string, value: number) {
            return subjectCounterMap.set(key, value);
        },
        has: function(key: string) {
            return subjectCounterMap.has(key);
        },
        get: function(key: string) {
            return subjectCounterMap.get(key);
        },
    };
})();

export abstract class BasePartitioner {
    protected readonly message: LiftbridgeMessage;
    protected readonly metadata: IMetadata;

    constructor(message: LiftbridgeMessage, metadata: IMetadata) {
        this.message = message;
        this.metadata = metadata;
    }

    protected getPartitionCount(): number {
        const subject = this.message.getSubject();
        const streamMeta = this.metadata.streams.bySubject[subject];
        if (!streamMeta) {
            throw new StreamNotFoundInMetadataError();
        }
        const partitionsCount = Object.keys(streamMeta.partitions).length;
        return partitionsCount;
    }

    public abstract calculatePartition(): number;
}

/**
 * `KeyPartitioner` computes the partition number for a given message by hashing the
 * key (using the super-simple [FNV-1A](https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed/145633#145633)
 * algorithm) and modding by the number of partitions for the first stream found with
 * the subject of the message. This does not work with streams containing
 * wildcards in their subjects, e.g. "foo.*", since this matches on the subject
 * literal of the published message. This also has undefined behavior if there
 * are multiple streams for the given subject.
 */
export class KeyPartitioner extends BasePartitioner {
    public calculatePartition(): number {
        let key = this.message.getKey();
        if (!key) key = Buffer.from('');
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount === 0) return 0;
        const partition = fnv1a(key.toString()) % partitionsCount;
        return partition;
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
 */
export class RoundRobinPartitioner extends BasePartitioner {
    public calculatePartition(): number {
        let key = this.message.getKey();
        if (!key) key = Buffer.from('');
        let counter = 0;
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount === 0) return 0;
        const subject = this.message.getSubject();
        if (subjectCounter.has(subject)) {
            counter = <number>subjectCounter.get(subject);
            subjectCounter.add(subject, counter++);
        } else {
            subjectCounter.add(subject, counter);
        }
        return counter % partitionsCount;
    }
}

export const builtinPartitioners = {
    'key': KeyPartitioner,
    'roundrobin': RoundRobinPartitioner,
};

export type BuiltinPartitioners = typeof builtinPartitioners;
export type PartitionerLike = new(message: LiftbridgeMessage, metadata: IMetadata) => BasePartitioner;
