// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var api_pb = require('./api_pb.js');

function serialize_proto_CreateStreamRequest(arg) {
  if (!(arg instanceof api_pb.CreateStreamRequest)) {
    throw new Error('Expected argument of type proto.CreateStreamRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_CreateStreamRequest(buffer_arg) {
  return api_pb.CreateStreamRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_CreateStreamResponse(arg) {
  if (!(arg instanceof api_pb.CreateStreamResponse)) {
    throw new Error('Expected argument of type proto.CreateStreamResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_CreateStreamResponse(buffer_arg) {
  return api_pb.CreateStreamResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_FetchMetadataRequest(arg) {
  if (!(arg instanceof api_pb.FetchMetadataRequest)) {
    throw new Error('Expected argument of type proto.FetchMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_FetchMetadataRequest(buffer_arg) {
  return api_pb.FetchMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_FetchMetadataResponse(arg) {
  if (!(arg instanceof api_pb.FetchMetadataResponse)) {
    throw new Error('Expected argument of type proto.FetchMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_FetchMetadataResponse(buffer_arg) {
  return api_pb.FetchMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_Message(arg) {
  if (!(arg instanceof api_pb.Message)) {
    throw new Error('Expected argument of type proto.Message');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_Message(buffer_arg) {
  return api_pb.Message.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_PublishRequest(arg) {
  if (!(arg instanceof api_pb.PublishRequest)) {
    throw new Error('Expected argument of type proto.PublishRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_PublishRequest(buffer_arg) {
  return api_pb.PublishRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_PublishResponse(arg) {
  if (!(arg instanceof api_pb.PublishResponse)) {
    throw new Error('Expected argument of type proto.PublishResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_PublishResponse(buffer_arg) {
  return api_pb.PublishResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_proto_SubscribeRequest(arg) {
  if (!(arg instanceof api_pb.SubscribeRequest)) {
    throw new Error('Expected argument of type proto.SubscribeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_proto_SubscribeRequest(buffer_arg) {
  return api_pb.SubscribeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// API is the main Liftbridge server interface clients interact with.
var APIService = exports.APIService = {
  // CreateStream creates a new stream attached to a NATS subject. It returns
// an AlreadyExists status code if a stream with the given subject and name
// already exists.
createStream: {
    path: '/proto.API/CreateStream',
    requestStream: false,
    responseStream: false,
    requestType: api_pb.CreateStreamRequest,
    responseType: api_pb.CreateStreamResponse,
    requestSerialize: serialize_proto_CreateStreamRequest,
    requestDeserialize: deserialize_proto_CreateStreamRequest,
    responseSerialize: serialize_proto_CreateStreamResponse,
    responseDeserialize: deserialize_proto_CreateStreamResponse,
  },
  // Subscribe creates an ephemeral subscription for the given stream. It
// begins to receive messages starting at the given offset and waits for
// new messages when it reaches the end of the stream. Use the request
// context to close the subscription.
subscribe: {
    path: '/proto.API/Subscribe',
    requestStream: false,
    responseStream: true,
    requestType: api_pb.SubscribeRequest,
    responseType: api_pb.Message,
    requestSerialize: serialize_proto_SubscribeRequest,
    requestDeserialize: deserialize_proto_SubscribeRequest,
    responseSerialize: serialize_proto_Message,
    responseDeserialize: deserialize_proto_Message,
  },
  // FetchMetadata retrieves the latest cluster metadata, including stream
// broker information.
fetchMetadata: {
    path: '/proto.API/FetchMetadata',
    requestStream: false,
    responseStream: false,
    requestType: api_pb.FetchMetadataRequest,
    responseType: api_pb.FetchMetadataResponse,
    requestSerialize: serialize_proto_FetchMetadataRequest,
    requestDeserialize: deserialize_proto_FetchMetadataRequest,
    responseSerialize: serialize_proto_FetchMetadataResponse,
    responseDeserialize: deserialize_proto_FetchMetadataResponse,
  },
  // Publish a new message to a subject. If the AckPolicy is not NONE and a
// deadline is provided, this will synchronously block until the ack is
// received. If the ack is not received in time, a DeadlineExceeded status
// code is returned.
publish: {
    path: '/proto.API/Publish',
    requestStream: false,
    responseStream: false,
    requestType: api_pb.PublishRequest,
    responseType: api_pb.PublishResponse,
    requestSerialize: serialize_proto_PublishRequest,
    requestDeserialize: deserialize_proto_PublishRequest,
    responseSerialize: serialize_proto_PublishResponse,
    responseDeserialize: deserialize_proto_PublishResponse,
  },
};

exports.APIClient = grpc.makeGenericClientConstructor(APIService);
