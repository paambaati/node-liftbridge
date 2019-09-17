import test from 'tape';
import LiftbridgeMessage, { AckPolicy } from '../src/message';

test('✉️ Message — constructor should correctly set all values.', t => {
    t.plan(17);
    const message1 = new LiftbridgeMessage({
        value: 'some-value',
    });
    t.equal(message1.getValue().toString(), 'some-value', 'value should be set.');
    t.equal(message1.getKey().toString(), '', 'key should be set to empty string.');
    t.equal(message1.getAckpolicy(), AckPolicy.NONE, 'ackpolicy should be set to NONE.');
    t.false((message1.getCorrelationid() === null
        || message1.getCorrelationid() === undefined
        || message1.getCorrelationid() === ''),
    'correlation ID should be set.');

    const message2 = new LiftbridgeMessage({
        value: 'some-value',
        subject: 'test-subject-1',
    });
    t.equal(message2.getSubject(), 'test-subject-1', 'subject should be set.');

    const message3 = new LiftbridgeMessage({
        value: 'some-value',
        key: 'some-key',
    });
    t.equal(message3.getKey().toString(), 'some-key', 'key as a string should be set.');

    const message4 = new LiftbridgeMessage({
        value: 'some-value',
        key: Buffer.from('some-key'),
    });
    t.equal(message4.getKey().toString(), 'some-key', 'key as a Buffer should be set.');

    const message5 = new LiftbridgeMessage({
        value: Buffer.from('some-value'),
    });
    t.equal(message5.getValue().toString(), 'some-value', 'value as a Buffer should be set.');

    const message6 = new LiftbridgeMessage({
        value: 'some-value',
        partition: 9,
    });
    t.equal(message6.partition, 9, 'partition should be set if passed as an option.');
    t.equal(message6.partitionStrategy, undefined, 'partition strategy should be unset if partition is set.');

    const message7 = new LiftbridgeMessage({
        value: 'some-value',
        partitionStrategy: 'key',
    });
    t.equal(message7.partitionStrategy, 'key', 'partition strategy should be set if passed as an option.');
    t.equal(message7.partition, undefined, 'partition should be unset if partition strategy is set.');

    const message8 = new LiftbridgeMessage({
        value: 'some-value',
        ackInbox: 'subject.9',
        correlationId: 'abcdfegh',
        ackPolicy: AckPolicy.LEADER,
    });
    t.equal(message8.getAckinbox(), 'subject.9', 'ackInbox should be set if passed as an option.');
    t.equal(message8.getCorrelationid(), 'abcdfegh', 'correlation ID should be set if passed as an option.');
    t.equal(message8.getAckpolicy(), AckPolicy.LEADER, 'ackPolicy should be set if passed as an option.');

    const message9 = new LiftbridgeMessage({
        value: 'some-value',
        headers: { test: 'hello', example: null },
    });
    t.deepEqual(message9.getHeadersMap().toObject().sort(), [
        ['test', Buffer.from('hello')],
        ['example', Buffer.from('')], // `null` gets turned to an empty string.
    ].sort(), 'headers map should be set if passed as an option.');

    const message10 = new LiftbridgeMessage({
        value: 'some-value',
        headers: { },
    });
    t.deepEqual(message10.getHeadersMap().toObject(), [], 'headers map should be empty if no key-value pairs are set in headers.');
    t.end();
});

test('✉️ Message — `serializeMessage()` should serialize a Liftbridge message.', t => {
    t.plan(1);
    const message = new LiftbridgeMessage({
        key: 'hello',
        value: 'test',
        ackPolicy: AckPolicy.ALL,
        headers: {
            example: 'sweet',
        },
    });
    const envelopeCookie = Buffer.from('LIFT');
    const envelopeCookieLength = envelopeCookie.length;
    const serializedMessage = message.serializeBinary();
    const expectedOutput = Buffer.concat([envelopeCookie, serializedMessage], envelopeCookieLength + serializedMessage.length);
    t.equal(Buffer.compare(expectedOutput, message.serializeMessage()), 0, '`serializeMessage()` should correctly generate a NATS-ready Liftbridge message.');
    t.end();
});

test('✉️ Message — `toJSON()` should correctly transform a Liftbridge message to human-friendly JSON.', t => {
    t.plan(1);
    const message = new LiftbridgeMessage({
        key: 'hello',
        value: 'test',
        ackPolicy: AckPolicy.ALL,
        partition: 4,
        correlationId: 'xxx',
        headers: {
            example: 'sweet',
            // @ts-ignore So we can try to pass in buffers too and see if they're toJSON()-able.
            lol: Buffer.from('420'),
        },
    });
    t.deepEqual(LiftbridgeMessage.toJSON(message), {
        offset: '0',
        key: 'hello',
        value: 'test',
        timestamp: '0',
        subject: '',
        reply: '',
        ackinbox: '',
        correlationid: 'xxx',
        ackpolicy: AckPolicy.ALL,
        headers: { example: 'sweet', lol: '420' },
    }, 'should correctly return a nice JSON.');
    t.end();
});
