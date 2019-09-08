import { randomBytes } from 'crypto';
import LiftbridgeStream from './stream';
import LiftbridgeMessage, { AckPolicy } from './message';
import LiftbridgeClient from './index';

if (!module.parent) {
    const subject = 'test7';
    const streamName = 'test-stream-gp-7';

    function msg() {
        const key = 'KEY-' + randomBytes(10).toString('hex');
        return new LiftbridgeMessage({ subject, key, value: `VALUE-ok-${key}`, ackPolicy: AckPolicy.ALL, partitionStrategy: 'key' });
    }

    const lbClient = new LiftbridgeClient(['localhost:9292']);
    const stream = new LiftbridgeStream({ subject, name: streamName, partitions: 3 });

    lbClient.connect().then((client) => {
        console.log('connected to -> ', client.getChannel().getTarget());
        lbClient.createStream(stream).then(response => {
            console.log('response for create stream = ', response.toObject());
        }).catch(console.error).finally(async () => {
            console.log('going to publish', msg().toObject());
            const pubres1 = await lbClient.publish(msg());
            console.log('publish result 1 = ', pubres1.toObject());
            const pubres2 = await lbClient.publish(msg());
            console.log('publish result 2 = ', pubres2.toObject());
            const pubres3 = await lbClient.publish(msg());
            console.log('publish result 3 = ', pubres3.toObject());
            await lbClient.publish(msg());
            console.log('going to subscribe');
            const sub = lbClient.subscribe(stream);
            sub.on('status', (data) => {
                console.log('subscribe on status = ', data);
            });
            sub.on('data', (data) => {
                console.log('subscribe on data = ', data.toObject());
            });
            sub.on('error', err => {
                console.error('subscribe on error! ', err);
            });
            sub.on('close', () => {
                console.log('subscribe on close!');
            });
            await lbClient.publish(msg());
            await lbClient.publish(msg());
            await lbClient.publish(msg());
        });
    });
}
