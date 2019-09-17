import fnv1a from '@sindresorhus/fnv1a';
import { IMetadata } from './metadata';
import { StreamNotFoundInMetadataError } from './errors';

/**
 * @hidden Module-level closure that holds a subject counter for use in the RoundRobinPartitioner.
 */
const subjectCounter = (function subjectCounter() {
    const subjectCounterMap: Map<string, number> = new Map();
    return {
        add(key: string, value: number) {
            return subjectCounterMap.set(key, value);
        },
        has(key: string) {
            return subjectCounterMap.has(key);
        },
        get(key: string) {
            return subjectCounterMap.get(key);
        },
    };
}());

/**
 * Abstract class for Liftbridge partitioner.
 *
 * All custom implementations must implment the [[calculatePartition]] method.
 *
 * @category Partition
 */
export abstract class BasePartitioner {
    protected readonly subject: string;

    protected readonly key: string;

    protected readonly metadata: IMetadata;

    /**
     * Partitioner base class.
     *
     * Custom partitioners are expected to extends this class and implement
     * the [[calculatePartition]] method.
     * @param message Liftbridge Message object.
     * @param metadata Metadata object.
     */
    constructor(subject: string, key: string | Uint8Array, metadata: IMetadata) {
        this.subject = subject;
        this.key = typeof key === 'string' ? key : key.toString();
        this.metadata = metadata;
    }

    // Gets total number of partitions for given stream subject.
    protected getPartitionCount(): number {
        const streamMeta = this.metadata.streams.bySubject[this.subject];
        if (!streamMeta) {
            throw new StreamNotFoundInMetadataError();
        }
        const partitionsCount = Object.keys(streamMeta.partitions).length;
        return partitionsCount;
    }

    /**
     * Calculate the partition for the given message.
     *
     * @returns Partition to send the message to.
     */
    public abstract calculatePartition(): number;
}

/**
 * Computes the partition number for a given message by hashing the key (using the
 * super-simple [FNV-1A](https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed/145633#145633)
 * algorithm) and modding by the number of partitions for the first stream found with
 * the subject of the message. This does not work with streams containing
 * wildcards in their subjects, e.g. "foo.*", since this matches on the subject
 * literal of the published message. This also has undefined behavior if there
 * are multiple streams for the given subject.
 *
 * @category Partition
 */
export class KeyPartitioner extends BasePartitioner {
    /**
     * Calculate the partition for the given message by hashing the key.
     *
     * @returns Partition to send the message to.
     */
    public calculatePartition(): number {
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount <= 1) return 0;
        const partition = fnv1a(this.key) % partitionsCount;
        return partition;
    }
}

/**
 * Computes the partition number for a given message in a
 * round-robin fashion by atomically incrementing a counter for the message
 * subject and modding by the number of partitions for the first stream found
 * with the subject. This does not work with streams containing wildcards in
 * their subjects, e.g. "foo.*", since this matches on the subject literal of
 * the published message. This also has undefined behavior if there are multiple
 * streams for the given subject.
 *
 * @category Partition
 */
export class RoundRobinPartitioner extends BasePartitioner {
    /**
     * Calculate the partition for the given message by rotating the
     * message subject in a round-robin fashion.
     *
     * @returns Partition to send the message to.
     */
    public calculatePartition(): number {
        const partitionsCount = this.getPartitionCount();
        if (partitionsCount <= 1) return 0;
        let counter = 0;
        if (subjectCounter.has(this.subject)) {
            counter = <number>subjectCounter.get(this.subject);
            subjectCounter.add(this.subject, counter += 1);
        } else {
            subjectCounter.add(this.subject, counter);
        }
        return counter % partitionsCount;
    }
}

/**
 * Builtin partioners as simple strings.
 *
 * @category Partition
 */
export const builtinPartitioners = {
    key: KeyPartitioner,
    roundrobin: RoundRobinPartitioner,
};

/**
 * All available builtin partitioners.
 *
 * @category Partition
 */
export type BuiltinPartitioners = typeof builtinPartitioners;

/**
 * Pluggable partitioner that must be an implementation of [[BasePartitioner]].
 *
 * @category Partition
 */
export type PartitionerLike = new(subject: string, key: string | Uint8Array, metadata: IMetadata) => BasePartitioner;
