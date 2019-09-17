import test from 'tape';
import fnv1a from '@sindresorhus/fnv1a';
import { KeyPartitioner, RoundRobinPartitioner, BasePartitioner } from '../src/partition';
import { StreamNotFoundInMetadataError, ErrorCodes } from '../src/errors';
import readFile from './helpers/read-file';
import { IMetadata } from '../src/metadata';

class TestPartitioner extends BasePartitioner {
    public calculatePartition(): number { // Always returns total partitions + 420.
        const totalPartitions = this.getPartitionCount();
        return 420 + totalPartitions;
    }
}

test('⚖️ Partition — `BasePartitioner` should have values correctly set and all methods should work correctly on an implementation.', async t => {
    t.plan(4);
    const metadata: IMetadata = JSON.parse(await readFile('./fixtures/partition/metadata_1_partition.json'));
    const testPartitioner1 = new TestPartitioner('test-subject-1', 'some-key', metadata);
    t.equal(testPartitioner1.calculatePartition(), 421, 'custom implementation should work correctly.');
    const testPartitioner2 = new TestPartitioner('test-subject-1', Buffer.from('some-key'), metadata);
    t.equal(testPartitioner2.calculatePartition(), 421, 'keys as Buffers should still work.');
    try {
        const testPartitioner3 = new TestPartitioner('unknown-subject-1', 'some-key', metadata);
        testPartitioner3.calculatePartition();
        t.fail('1calculatePartition()` should throw error for unknown subject.');
    } catch (err) {
        t.true(err instanceof StreamNotFoundInMetadataError, 'thrown error should be correct.');
        t.equal(err.code, ErrorCodes.ERR_STREAM_NOT_FOUND_IN_METADATA, 'error code should be correct.');
    }
    t.end();
});

test('⚖️ Partition — `KeyPartitioner` should correctly partition on keys by hashing them.', async t => {
    t.plan(2);
    const metadata1: IMetadata = JSON.parse(await readFile('./fixtures/partition/metadata_1_partition.json'));
    const keyPartitioner1 = new KeyPartitioner('test-subject-1', 'some-key', metadata1);
    t.equal(keyPartitioner1.calculatePartition(), 0, 'should always return 0 for 1 partition.');
    const metadata2: IMetadata = JSON.parse(await readFile('./fixtures/partition/metadata_5_partitions.json'));
    const keyPartitioner2 = new KeyPartitioner('test-subject-1', 'some-other-key', metadata2);
    const expectedPartition = fnv1a('some-key') % Object.keys(metadata2.streams.bySubject['test-subject-1'].partitions).length;
    t.equal(keyPartitioner2.calculatePartition(), expectedPartition, 'should correctly partition by hashing the key.');
    t.end();
});

test('⚖️ Partition — `RoundRobinPartitioner` should correctly partition on keys in a round-robin fashion.', async t => {
    t.plan(7);
    const metadata1: IMetadata = JSON.parse(await readFile('./fixtures/partition/metadata_1_partition.json'));
    const rrPartitioner1 = new RoundRobinPartitioner('test-subject-1', 'some-key', metadata1);
    t.equal(rrPartitioner1.calculatePartition(), 0, 'should always return 0 for 1 partition.');
    const metadata2: IMetadata = JSON.parse(await readFile('./fixtures/partition/metadata_5_partitions.json'));
    const rrPartitioner2 = new RoundRobinPartitioner('test-subject-1', 'some-other-key', metadata2);
    t.equal(rrPartitioner2.calculatePartition(), 0, 'should first return partition #0.');
    t.equal(rrPartitioner2.calculatePartition(), 1, 'should then return partition #1.');
    t.equal(rrPartitioner2.calculatePartition(), 2, 'should then return partition #2.');
    t.equal(rrPartitioner2.calculatePartition(), 3, 'should then return partition #3.');
    t.equal(rrPartitioner2.calculatePartition(), 4, 'should then return partition #4.');
    t.equal(rrPartitioner2.calculatePartition(), 0, 'should cycle back and then return partition #0 again.');
    t.end();
});
