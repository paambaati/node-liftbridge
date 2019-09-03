// GENERATED CODE -- DO NOT EDIT!

// package: proto
// file: api.proto

import * as api_pb from "./api_pb";
import * as grpc from "grpc";

interface IAPIService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  createStream: grpc.MethodDefinition<api_pb.CreateStreamRequest, api_pb.CreateStreamResponse>;
  subscribe: grpc.MethodDefinition<api_pb.SubscribeRequest, api_pb.Message>;
  fetchMetadata: grpc.MethodDefinition<api_pb.FetchMetadataRequest, api_pb.FetchMetadataResponse>;
  publish: grpc.MethodDefinition<api_pb.PublishRequest, api_pb.PublishResponse>;
}

export const APIService: IAPIService;

export class APIClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  createStream(argument: api_pb.CreateStreamRequest, callback: grpc.requestCallback<api_pb.CreateStreamResponse>): grpc.ClientUnaryCall;
  createStream(argument: api_pb.CreateStreamRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.CreateStreamResponse>): grpc.ClientUnaryCall;
  createStream(argument: api_pb.CreateStreamRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.CreateStreamResponse>): grpc.ClientUnaryCall;
  subscribe(argument: api_pb.SubscribeRequest, metadataOrOptions?: grpc.Metadata | grpc.CallOptions | null): grpc.ClientReadableStream<api_pb.Message>;
  subscribe(argument: api_pb.SubscribeRequest, metadata?: grpc.Metadata | null, options?: grpc.CallOptions | null): grpc.ClientReadableStream<api_pb.Message>;
  fetchMetadata(argument: api_pb.FetchMetadataRequest, callback: grpc.requestCallback<api_pb.FetchMetadataResponse>): grpc.ClientUnaryCall;
  fetchMetadata(argument: api_pb.FetchMetadataRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.FetchMetadataResponse>): grpc.ClientUnaryCall;
  fetchMetadata(argument: api_pb.FetchMetadataRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.FetchMetadataResponse>): grpc.ClientUnaryCall;
  publish(argument: api_pb.PublishRequest, callback: grpc.requestCallback<api_pb.PublishResponse>): grpc.ClientUnaryCall;
  publish(argument: api_pb.PublishRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.PublishResponse>): grpc.ClientUnaryCall;
  publish(argument: api_pb.PublishRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<api_pb.PublishResponse>): grpc.ClientUnaryCall;
}
