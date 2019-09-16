# node-liftbridge

![](liftbridge.svg)

<p align="center">
  <img width="300" height="300" src="media/node-liftbridge.svg">
</p>

Node.js client for [Liftbridge](https://github.com/liftbridge-io/liftbridge).

> Liftbridge provides lightweight, fault-tolerant message streams by implementing a durable stream augmentation for the [NATS messaging system](https://nats.io/). It extends NATS with a Kafka-like publish-subscribe log API that is highly available and horizontally scalable. Use Liftbridge as a simpler and lighter alternative to systems like Kafka and Pulsar or use it to add streaming semantics to an existing NATS deployment.

🚧 **This module is still under active development!** [Would you like to contribute?](https://github.com/paambaati/node-liftbridge) 🚧

## Installation

```bash
yarn add liftbridge
# or
npm install liftbridge
```

## Usage

```typescript
import LiftbridgeClient from 'liftbridge';

const client = new LiftbridgeClient('localhost:9292');
await client.connect();

await client.createStream(new LiftbridgeStream({
     subject: 'my-subject',
     name: 'stream-name',
     partitions: 5,
     maxReplication: true
});
```

📚 See [Documentation](https://paambaati.github.io/node-liftbridge/classes/liftbridgeclient.html) for more detailed examples.

## Developer Notes

1. To regenerate the gRPC bindings, update the path to the [latest proto file](https://github.com/liftbridge-io/liftbridge-grpc/blob/master/api.proto) and then run `./scripts/generate_grpc_code.sh`

## Roadmap

- [ ] Tests & coverage
- [ ] CI
- [ ] Contribution guide
- [ ] gRPC Connection pool
- [ ] Logging
