import { randomBytes } from 'crypto';
import LiftbridgeStream from './stream';
import LiftbridgeMessage from './message';
import LiftbridgeClient from './index';

if (!module.parent) {

    const subject = 'test-subject-gp';
    function msg() {
        const key = randomBytes(20).toString('hex');;
        return new LiftbridgeMessage({ subject, key, value: `ok-${key}` });
    }

    const lbClient = new LiftbridgeClient('localhost:9292');
    const stream = new LiftbridgeStream({ subject, name: 'test-stream-gp' });

    lbClient.createStream(stream).then(response => {
        console.log('response for create stream = ', response.toObject());
    }).catch(err => {
        // console.warn('error in create!!!!' , err);
    }).finally(async () => {
        console.log('going to publish');
        const pubres = await lbClient.publish(msg());
        console.log('publish result = ', pubres.toObject());
        await lbClient.publish(msg());
        await lbClient.publish(msg());
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
}
