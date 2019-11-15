import test from 'tape';
import LiftbridgeMetadata from '../src/metadata';
import {
    FetchMetadataResponse, Broker, StreamMetadata, PartitionMetadata,
} from '../grpc/generated/api_pb';
import readFile from './helpers/read-file';
import {
    NoSuchPartitionError, ErrorCodes, NoKnownPartitionError, NoKnownLeaderForPartitionError,
} from '../src/errors';

/**
 * Converts a dump of Liftbridge RPC Metadata JSON to a `FetchMetadataResponse` object.
 * @param meta Metadata JSON.
 * @returns An instance of `FetchMetadataResponse`.
 */
function metadataJsonToResponse(meta: object): FetchMetadataResponse {
    const metadataResponse = new FetchMetadataResponse();

    meta.brokersList.forEach(broker => {
        const b = new Broker();
        b.setHost(broker.host);
        b.setPort(broker.port);
        b.setId(broker.id);
        metadataResponse.addBrokers(b);
    });

    meta.metadataList.forEach(metadata => {
        const sm = new StreamMetadata();
        sm.setName(metadata.name);
        sm.setSubject(metadata.subject);
        metadataResponse.addMetadata(sm);

        metadata.partitionsMap.forEach(pMap => {
            const idx = pMap[0];
            const pMeta = pMap[1];
            const pm = new PartitionMetadata();
            pm.setId(idx);
            pm.setLeader(pMeta.leader);
            pMeta.replicasList.forEach(_ => pm.addReplicas(_));
            pMeta.isrList.forEach(_ => pm.addIsr(_));
            sm.getPartitionsMap().set(idx, pm);
        });
    });
    return metadataResponse;
}

test('Ⓜ️ Metadata — `build()` should return a nice human-friendly JSON interface for given Liftbridge raw metadata.', async t => {
    t.plan(4);
    const metadataResponse = metadataJsonToResponse(JSON.parse(await readFile('./fixtures/metadata/metadata_simple.json')));
    // @ts-ignore No need to construct and pass a Client instance for this test.
    const metadata = new LiftbridgeMetadata(null, metadataResponse);
    t.deepEqual(Object.keys(metadata.get()).sort(), ['addresses', 'brokers', 'lastUpdated', 'streams'].sort(), 'should contain all the expected keys.');
    t.deepEqual(metadata.get().brokers, {
        DMxXSQifWCW2rdFsr2vk4S: {
            id: 'DMxXSQifWCW2rdFsr2vk4S',
            host: '127.0.0.1',
            port: 9292,
        },
    }, 'brokers metadata should be correctly set.');
    t.deepEqual(metadata.get().streams, {
        byName: {
            'test-stream-1': {
                subject: 'test-subject-1',
                name: 'test-stream-1',
                partitions: [{
                    id: 0,
                    leader: {
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    },
                    replicas: [{
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    }],
                    isr: [{
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    }],
                }],
            },
        },
        bySubject: {
            'test-subject-1': {
                subject: 'test-subject-1',
                name: 'test-stream-1',
                partitions: [{
                    id: 0,
                    leader: {
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    },
                    replicas: [{
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    }],
                    isr: [{
                        id: 'DMxXSQifWCW2rdFsr2vk4S',
                        host: '127.0.0.1',
                        port: 9292,
                    }],
                }],
            },
        },
    }, 'streams/partitions metadata should be correctly set.');
    t.deepEqual(metadata.get().addresses, {}, 'addresses metadata should be correctly set.');
    t.end();
});

test('Ⓜ️ Metadata — `getAddress()` should return broker address for the given stream partition.', async t => {
    t.plan(7);
    const metadataResponse1 = metadataJsonToResponse(JSON.parse(await readFile('./fixtures/metadata/metadata_simple.json')));
    // @ts-ignore No need to construct and pass a Client instance for this test.
    const metadata = new LiftbridgeMetadata(null, metadataResponse1);

    t.equal(metadata.getAddress('test-stream-1', 0), '127.0.0.1:9292', 'address should be correct.');

    try {
        metadata.getAddress('unknown-stream-1', 1);
        t.fail('should throw for unknown stream.');
    } catch (err) {
        t.true(err instanceof NoSuchPartitionError, 'thrown error should be correct.');
        t.equal(err.code, ErrorCodes.ERR_PARTITION_DOES_NOT_EXIST, 'error code should be correct.');
    }

    try {
        metadata.getAddress('test-stream-1', 1);
    } catch (err) {
        t.true(err instanceof NoKnownPartitionError, 'thrown error should be correct.');
        t.equal(err.code, ErrorCodes.ERR_NO_KNOWN_PARTITION, 'error code should be correct.');
    }

    try {
        const metadataResponse2 = metadataJsonToResponse(JSON.parse(await readFile('./fixtures/metadata/metadata_no_leader.json')));
        // @ts-ignore No need to construct and pass a Client instance for this test.
        const metadata2 = new LiftbridgeMetadata(null, metadataResponse2);
        metadata2.getAddress('test-stream-1', 0);
        t.fail('should throw when there is no leader.');
    } catch (err) {
        t.true(err instanceof NoKnownLeaderForPartitionError, 'thrown error should be correct.');
        t.equal(err.code, ErrorCodes.ERR_NO_KNOWN_LEADER_FOR_PARTITION, 'error code should be correct.');
    }

    t.end();
});

test('Ⓜ️ Metadata — `hasSubjectMetadata()` should tell if the given subject has any metadata for it.', async t => {
    t.plan(2);
    const metadataResponse = metadataJsonToResponse(JSON.parse(await readFile('./fixtures/metadata/metadata_simple.json')));
    // @ts-ignore No need to construct and pass a Client instance for this test.
    const metadata = new LiftbridgeMetadata(null, metadataResponse);
    t.true(metadata.hasSubjectMetadata('test-subject-1'), 'should return `true` for a subject we know has metadata.');
    t.false(metadata.hasSubjectMetadata('unknown-subject-1'), 'should return `false` unknown subject.');
    t.end();
});
