// package: proto
// file: api.proto

import * as jspb from "google-protobuf";

export class CreateStreamRequest extends jspb.Message {
  getSubject(): string;
  setSubject(value: string): void;

  getName(): string;
  setName(value: string): void;

  getGroup(): string;
  setGroup(value: string): void;

  getReplicationfactor(): number;
  setReplicationfactor(value: number): void;

  getPartitions(): number;
  setPartitions(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateStreamRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateStreamRequest): CreateStreamRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateStreamRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateStreamRequest;
  static deserializeBinaryFromReader(message: CreateStreamRequest, reader: jspb.BinaryReader): CreateStreamRequest;
}

export namespace CreateStreamRequest {
  export type AsObject = {
    subject: string,
    name: string,
    group: string,
    replicationfactor: number,
    partitions: number,
  }
}

export class CreateStreamResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateStreamResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateStreamResponse): CreateStreamResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CreateStreamResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateStreamResponse;
  static deserializeBinaryFromReader(message: CreateStreamResponse, reader: jspb.BinaryReader): CreateStreamResponse;
}

export namespace CreateStreamResponse {
  export type AsObject = {
  }
}

export class SubscribeRequest extends jspb.Message {
  getStream(): string;
  setStream(value: string): void;

  getPartition(): number;
  setPartition(value: number): void;

  getStartposition(): StartPositionMap[keyof StartPositionMap];
  setStartposition(value: StartPositionMap[keyof StartPositionMap]): void;

  getStartoffset(): number;
  setStartoffset(value: number): void;

  getStarttimestamp(): number;
  setStarttimestamp(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SubscribeRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SubscribeRequest): SubscribeRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SubscribeRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SubscribeRequest;
  static deserializeBinaryFromReader(message: SubscribeRequest, reader: jspb.BinaryReader): SubscribeRequest;
}

export namespace SubscribeRequest {
  export type AsObject = {
    stream: string,
    partition: number,
    startposition: StartPositionMap[keyof StartPositionMap],
    startoffset: number,
    starttimestamp: number,
  }
}

export class FetchMetadataRequest extends jspb.Message {
  clearStreamsList(): void;
  getStreamsList(): Array<string>;
  setStreamsList(value: Array<string>): void;
  addStreams(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FetchMetadataRequest.AsObject;
  static toObject(includeInstance: boolean, msg: FetchMetadataRequest): FetchMetadataRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FetchMetadataRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FetchMetadataRequest;
  static deserializeBinaryFromReader(message: FetchMetadataRequest, reader: jspb.BinaryReader): FetchMetadataRequest;
}

export namespace FetchMetadataRequest {
  export type AsObject = {
    streamsList: Array<string>,
  }
}

export class FetchMetadataResponse extends jspb.Message {
  clearBrokersList(): void;
  getBrokersList(): Array<Broker>;
  setBrokersList(value: Array<Broker>): void;
  addBrokers(value?: Broker, index?: number): Broker;

  clearMetadataList(): void;
  getMetadataList(): Array<StreamMetadata>;
  setMetadataList(value: Array<StreamMetadata>): void;
  addMetadata(value?: StreamMetadata, index?: number): StreamMetadata;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FetchMetadataResponse.AsObject;
  static toObject(includeInstance: boolean, msg: FetchMetadataResponse): FetchMetadataResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FetchMetadataResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FetchMetadataResponse;
  static deserializeBinaryFromReader(message: FetchMetadataResponse, reader: jspb.BinaryReader): FetchMetadataResponse;
}

export namespace FetchMetadataResponse {
  export type AsObject = {
    brokersList: Array<Broker.AsObject>,
    metadataList: Array<StreamMetadata.AsObject>,
  }
}

export class PublishRequest extends jspb.Message {
  hasMessage(): boolean;
  clearMessage(): void;
  getMessage(): Message | undefined;
  setMessage(value?: Message): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublishRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PublishRequest): PublishRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PublishRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PublishRequest;
  static deserializeBinaryFromReader(message: PublishRequest, reader: jspb.BinaryReader): PublishRequest;
}

export namespace PublishRequest {
  export type AsObject = {
    message?: Message.AsObject,
  }
}

export class PublishResponse extends jspb.Message {
  hasAck(): boolean;
  clearAck(): void;
  getAck(): Ack | undefined;
  setAck(value?: Ack): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PublishResponse.AsObject;
  static toObject(includeInstance: boolean, msg: PublishResponse): PublishResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PublishResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PublishResponse;
  static deserializeBinaryFromReader(message: PublishResponse, reader: jspb.BinaryReader): PublishResponse;
}

export namespace PublishResponse {
  export type AsObject = {
    ack?: Ack.AsObject,
  }
}

export class Broker extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getHost(): string;
  setHost(value: string): void;

  getPort(): number;
  setPort(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Broker.AsObject;
  static toObject(includeInstance: boolean, msg: Broker): Broker.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Broker, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Broker;
  static deserializeBinaryFromReader(message: Broker, reader: jspb.BinaryReader): Broker;
}

export namespace Broker {
  export type AsObject = {
    id: string,
    host: string,
    port: number,
  }
}

export class StreamMetadata extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getSubject(): string;
  setSubject(value: string): void;

  getError(): StreamMetadata.ErrorMap[keyof StreamMetadata.ErrorMap];
  setError(value: StreamMetadata.ErrorMap[keyof StreamMetadata.ErrorMap]): void;

  getPartitionsMap(): jspb.Map<number, PartitionMetadata>;
  clearPartitionsMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StreamMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: StreamMetadata): StreamMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: StreamMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StreamMetadata;
  static deserializeBinaryFromReader(message: StreamMetadata, reader: jspb.BinaryReader): StreamMetadata;
}

export namespace StreamMetadata {
  export type AsObject = {
    name: string,
    subject: string,
    error: StreamMetadata.ErrorMap[keyof StreamMetadata.ErrorMap],
    partitionsMap: Array<[number, PartitionMetadata.AsObject]>,
  }

  export interface ErrorMap {
    OK: 0;
    UNKNOWN_STREAM: 1;
  }

  export const Error: ErrorMap;
}

export class PartitionMetadata extends jspb.Message {
  getId(): number;
  setId(value: number): void;

  getLeader(): string;
  setLeader(value: string): void;

  clearReplicasList(): void;
  getReplicasList(): Array<string>;
  setReplicasList(value: Array<string>): void;
  addReplicas(value: string, index?: number): string;

  clearIsrList(): void;
  getIsrList(): Array<string>;
  setIsrList(value: Array<string>): void;
  addIsr(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PartitionMetadata.AsObject;
  static toObject(includeInstance: boolean, msg: PartitionMetadata): PartitionMetadata.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PartitionMetadata, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PartitionMetadata;
  static deserializeBinaryFromReader(message: PartitionMetadata, reader: jspb.BinaryReader): PartitionMetadata;
}

export namespace PartitionMetadata {
  export type AsObject = {
    id: number,
    leader: string,
    replicasList: Array<string>,
    isrList: Array<string>,
  }
}

export class Message extends jspb.Message {
  getOffset(): number;
  setOffset(value: number): void;

  getKey(): Uint8Array | string;
  getKey_asU8(): Uint8Array;
  getKey_asB64(): string;
  setKey(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  getTimestamp(): number;
  setTimestamp(value: number): void;

  getSubject(): string;
  setSubject(value: string): void;

  getReply(): string;
  setReply(value: string): void;

  getHeadersMap(): jspb.Map<string, Uint8Array | string>;
  clearHeadersMap(): void;
  getAckinbox(): string;
  setAckinbox(value: string): void;

  getCorrelationid(): string;
  setCorrelationid(value: string): void;

  getAckpolicy(): AckPolicyMap[keyof AckPolicyMap];
  setAckpolicy(value: AckPolicyMap[keyof AckPolicyMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Message.AsObject;
  static toObject(includeInstance: boolean, msg: Message): Message.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Message, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Message;
  static deserializeBinaryFromReader(message: Message, reader: jspb.BinaryReader): Message;
}

export namespace Message {
  export type AsObject = {
    offset: number,
    key: Uint8Array | string,
    value: Uint8Array | string,
    timestamp: number,
    subject: string,
    reply: string,
    headersMap: Array<[string, Uint8Array | string]>,
    ackinbox: string,
    correlationid: string,
    ackpolicy: AckPolicyMap[keyof AckPolicyMap],
  }
}

export class Ack extends jspb.Message {
  getStream(): string;
  setStream(value: string): void;

  getPartitionsubject(): string;
  setPartitionsubject(value: string): void;

  getMsgsubject(): string;
  setMsgsubject(value: string): void;

  getOffset(): number;
  setOffset(value: number): void;

  getAckinbox(): string;
  setAckinbox(value: string): void;

  getCorrelationid(): string;
  setCorrelationid(value: string): void;

  getAckpolicy(): AckPolicyMap[keyof AckPolicyMap];
  setAckpolicy(value: AckPolicyMap[keyof AckPolicyMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Ack.AsObject;
  static toObject(includeInstance: boolean, msg: Ack): Ack.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Ack, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Ack;
  static deserializeBinaryFromReader(message: Ack, reader: jspb.BinaryReader): Ack;
}

export namespace Ack {
  export type AsObject = {
    stream: string,
    partitionsubject: string,
    msgsubject: string,
    offset: number,
    ackinbox: string,
    correlationid: string,
    ackpolicy: AckPolicyMap[keyof AckPolicyMap],
  }
}

export interface StartPositionMap {
  NEW_ONLY: 0;
  OFFSET: 1;
  EARLIEST: 2;
  LATEST: 3;
  TIMESTAMP: 4;
}

export const StartPosition: StartPositionMap;

export interface AckPolicyMap {
  LEADER: 0;
  ALL: 1;
  NONE: 2;
}

export const AckPolicy: AckPolicyMap;

