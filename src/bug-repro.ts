import { Client, credentials } from 'grpc';
import { SubscribeRequest, CreateStreamRequest } from '../grpc/generated/api_pb';
import { APIClient } from '.';

const ADDRESS = 'localhost:9292';
const CREDENTIALS = credentials.createInsecure();
const STREAM_NAME = 'test-1';
const SUBJECT = 'test-subject-1';

const connection = new Client(ADDRESS, CREDENTIALS);
connection.waitForReady(10000, () => {
    console.log('connection ready!');
    const client = new APIClient(ADDRESS, CREDENTIALS, {
        channelOverride: connection.getChannel(), // Reuse the working channel for APIClient.
    });
    const createRequest = new CreateStreamRequest();
    createRequest.setName(STREAM_NAME);
    createRequest.setSubject(SUBJECT);
    client.createStream(createRequest, (err) => {
        console.log('stream created! now subscribing...');
        const subscribeRequest = new SubscribeRequest();
        subscribeRequest.setStream(STREAM_NAME);
        const subscription = client.subscribe(subscribeRequest);

        subscription.on('error', err => {
            console.log('> subscribe error = ', err);
        });
        subscription.on('status', data => {
            console.log('> subscribe on status = ', data);
        });
        subscription.on('end', () => {
            console.log('> subscription ended!');
        });
        subscription.on('close', () => {
            console.log('> subscription closed!');
        });

        subscription.on('data', data => {
            console.log('> subscription data = ', data);
        });
    });
});
