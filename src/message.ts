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

    public serialize() {
        const serializedMessage = this.serializeBinary();
        return Buffer.concat([envelopeCookie, serializedMessage], envelopeCookieLength + serializedMessage.length);
    }
}
