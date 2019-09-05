import { crc32 } from 'rapid-crc';
import { AckPolicy, AckPolicyMap, Message } from '../grpc/generated/api_pb';
import { ILiftbridgeMetadata } from './metadata';
import LiftbridgeStream from './stream';

const envelopeCookie = Buffer.from('LIFT');
const envelopeCookieLength = envelopeCookie.length;

interface ILiftbridgeMessageHeader {
    [key: string]: string;
}

export interface ILiftbridgeMessage {
    subject: string;
    key: Uint8Array | string | null;
    value: Uint8Array | string;
    correlationId?: string;
    headers?: ILiftbridgeMessageHeader;
    ackInbox?: string;
    ackPolicy?: AckPolicyMap[keyof AckPolicyMap];
    offset?: number;
    timestamp?: number;
}

export default class LiftbridgeMessage extends Message {
    constructor({ subject, key, value, correlationId, headers, ackInbox, ackPolicy, offset, timestamp }: ILiftbridgeMessage) {
        super();
        this.setSubject(subject);
        this.setValue(value);

        if (key) {
            if (typeof key === 'string') {
                this.setKey(Buffer.from(key).toString('base64'));
            } else {
                this.setKey(key);
            }
        }

        if (correlationId) this.setCorrelationid(correlationId);
        if (ackInbox) this.setAckinbox(ackInbox);
        if (!ackPolicy) this.setAckpolicy(AckPolicy.NONE);
        if (offset) this.setOffset(offset);
        if (timestamp) this.setTimestamp(timestamp); // TODO: normalize with https://play.golang.org/p/CzdnDs5qxpA
    }

    private getPartitionCount(streamName: string, metadata: ILiftbridgeMetadata) {
        const streamMeta = metadata.metadataList.find(s => s && s.name === streamName);
        if (!streamMeta) {
            throw new Error('stream has no metadata!') // TODO: make a proper error out of this.
        }
        const partitionsCount = streamMeta.partitionsMap.length;
        return partitionsCount;
    }

    public serialize() {
        const serializedMessage = this.serializeBinary();
        return Buffer.concat([envelopeCookie, serializedMessage], envelopeCookieLength + serializedMessage.length);
    }

    /**
     * `partitionByKey` computes the partition number for a given message by hashing the
     * key and modding by the number of partitions for the first stream found with
     * the subject of the message. This does not work with streams containing
     * wildcards in their subjects, e.g. "foo.*", since this matches on the subject
     * literal of the published message. This also has undefined behavior if there
     * are multiple streams for the given subject.
     *
     * @param stream Stream to partition.
     * @param metadata Stream metadata.
     */
    public partitionByKey(stream: LiftbridgeStream, metadata: ILiftbridgeMetadata) {
        let key = this.getKey();
        if (!key) key = Buffer.from('');
        const partitionsCount = this.getPartitionCount(stream.name, metadata);
        if (partitionsCount === 0) return 0;
        return crc32(key) % partitionsCount;
    }

    /**
     * `partitionByRoundRobin` computes the partition number for a given message
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
    public partitionByRoundRobin(stream: LiftbridgeStream, metadata: ILiftbridgeMetadata) {
        const subjectCounterMap: Map<string, number> = new Map(); // TODO: Move this into a class as a instance property.
        let key = this.getKey();
        if (!key) key = Buffer.from('');
        let counter = 0;
        const partitionsCount = this.getPartitionCount(stream.name, metadata);
        if (partitionsCount === 0) return 0;
        if (subjectCounterMap.has(stream.subject)) {
            counter = <number>subjectCounterMap.get(stream.subject);
            subjectCounterMap.set(stream.subject, counter++);
        } else {
            subjectCounterMap.set(stream.subject, counter);
        }
        return counter % partitionsCount;
    }
}
