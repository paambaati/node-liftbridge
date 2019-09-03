# 🌉 node-liftbridge

![](liftbridge.svg)

Node.js client for [Liftbridge](https://github.com/liftbridge-io/liftbridge).

> Liftbridge provides lightweight, fault-tolerant message streams by implementing a durable stream augmentation for the [NATS messaging system](https://nats.io/). It extends NATS with a Kafka-like publish-subscribe log API that is highly available and horizontally scalable. Use Liftbridge as a simpler and lighter alternative to systems like Kafka and Pulsar or use it to add streaming semantics to an existing NATS deployment.

## Installation

```bash
yarn add liftbridge
# or
npm install liftbridge
```

## Usage

```typescript
// TODO
```

## Developer Notes

1. To regenerate the gRPC bindings, update the path to the [latest proto file](https://github.com/liftbridge-io/liftbridge-grpc/blob/master/api.proto) and then run `./scripts/generate_grpc_code.sh`

## Roadmap

- [ ] Tests & coverage
- [ ] CI
- [ ] gRPC Connection pool
- [ ] gRPC TLS support
- [ ] Logging
