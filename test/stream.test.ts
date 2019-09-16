import test from 'tape';
import LiftbridgeStream, { StartPosition } from '../src/stream';
import { InvalidPartitionsError, ErrorCodes, OffsetNotSpecifiedError, TimestampNotSpecifiedError } from '../src/errors';

test('🏞 Stream — constructor should return a `Stream` object with the correct default values set.', t => {
    t.plan(5);
    const stream = new LiftbridgeStream({
        subject: 'test-subject',
        name: 'test-stream',
    });
    t.equal(stream.subject, 'test-subject', 'should have the subject set.');
    t.equal(stream.name, 'test-stream', 'should have the stream name set.');
    t.equal(stream.partitions, 1, 'should default to 1 partition.');
    t.equal(stream.replicationFactor, 1, 'should default to a replication factor of 1.');
    t.equal(stream.startPosition, StartPosition.LATEST, 'should default to `LATEST` start position.');
    t.end();
});

test('🏞 Stream — constructor should return a `Stream` object with the correct optional values set.', t => {
    t.plan(3);
    const stream = new LiftbridgeStream({
        subject: 'test-subject',
        name: 'test-stream',
        group: 'my-fun-group',
        replicationFactor: 6,
        startPosition: StartPosition.EARLIEST,
    });
    t.equal(stream.group, 'my-fun-group', 'should have the group set.');
    t.equal(stream.replicationFactor, 6, 'should have the replication factor set.');
    t.equal(stream.startPosition, StartPosition.EARLIEST, 'should have the start position set.');
    t.end();
});


test('🏞 Stream — constructor should throw when an invalid value is set for `partitions`.', t => {
    t.plan(2);
    try {
        new LiftbridgeStream({
            subject: 'test-subject',
            name: 'test-stream',
            partitions: -1,
        });
        t.fail('constructor should throw an error.');
    } catch (err) {
        t.true(err instanceof InvalidPartitionsError, 'thrown error should be correct.');
        t.equal(err['code'], ErrorCodes.ERR_INVALID_PARTITIONS, 'error code should be correct.');
        t.end();
    }
});

test('🏞 Stream — constructor should throw when start position is set to offset but no offset is specified.', t => {
    t.plan(2);
    try {
        new LiftbridgeStream({
            subject: 'test-subject',
            name: 'test-stream',
            startPosition: StartPosition.OFFSET,
        });
        t.fail('constructor should throw an error.');
    } catch (err) {
        t.true(err instanceof OffsetNotSpecifiedError, 'thrown error should be correct.');
        t.equal(err['code'], ErrorCodes.ERR_OFFSET_NOT_SPECIFIED, 'error code should be correct.');
        t.end();
    }
});

test('🏞 Stream — constructor should throw when start position is set to timestamp but no timestamp is specified.', t => {
    t.plan(2);
    try {
        new LiftbridgeStream({
            subject: 'test-subject',
            name: 'test-stream',
            startPosition: StartPosition.TIMESTAMP,
        });
        t.fail('constructor should throw an error.');
    } catch (err) {
        t.true(err instanceof TimestampNotSpecifiedError, 'thrown error should be correct.');
        t.equal(err['code'], ErrorCodes.ERR_TIMESTAMP_NOT_SPECIFIED, 'error code should be correct.');
        t.end();
    }
});

test('🏞 Stream — constructor should return a `Stream` object with the correct `partitions` when `maxReplication` is set to `true`.', t => {
    t.plan(1);
    const stream = new LiftbridgeStream({
        subject: 'test-subject',
        name: 'test-stream',
        maxReplication: true,
        partitions: 10,
    });
    t.equal(stream.replicationFactor, -1, 'replication factor should be correctly set to -1.');
    t.end();
});

test('🏞 Stream — constructor should return a `Stream` object with the correct offset or partitions values set.', t => {
    t.plan(4);
    const stream1 = new LiftbridgeStream({
        subject: 'test-subject',
        name: 'test-stream',
        startOffset: 69,
    });
    t.equal(stream1.startOffset, 69, 'offset should be correctly set.');
    t.equal(stream1.startTimestamp, undefined, 'timestamp should not be set.');

    const stream2 = new LiftbridgeStream({
        subject: 'test-subject',
        name: 'test-stream',
        startTimestamp: 1568630702733000000,
    });
    t.equal(stream2.startTimestamp, 1568630702733000000, 'timestamp should be correctly set.');
    t.equal(stream2.startOffset, undefined, 'offset should not be set.');
    t.end();
});