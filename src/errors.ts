/* istanbul ignore file */
/* eslint max-classes-per-file: 0 */
/**
 * Custom errors.
 */

/**
 * Error code enums.
 */

/**
 * @hidden
 */
enum ConnectionErrorCodes {
    ERR_NO_ADDRESSES = 'ERR_NO_ADDRESSES',
    ERR_COULD_NOT_CONNECT = 'ERR_COULD_NOT_CONNECT',
    ERR_DEADLINE_EXCEEDED = 'ERR_DEADLINE_EXCEEDED',
}

/**
 * @hidden
 */
enum CreateStreamErrorCodes {
    ERR_PARTITION_ALREADY_EXISTS = 'ERR_PARTITION_ALREADY_EXISTS',
    ERR_INVALID_PARTITIONS = 'ERR_INVALID_PARTITIONS',
}

/**
 * @hidden
 */
enum SubscribeErrorCodes {
    ERR_PARTITION_DOES_NOT_EXIST = 'ERR_PARTITION_DOES_NOT_EXIST',
    ERR_OFFSET_NOT_SPECIFIED = 'ERR_OFFSET_NOT_SPECIFIED',
    ERR_TIMESTAMP_NOT_SPECIFIED = 'ERR_TIMESTAMP_NOT_SPECIFIED',
}

/**
 * @hidden
 */
enum MetadataErrorCodes {
    ERR_STREAM_NOT_FOUND_IN_METADATA = 'ERR_STREAM_NOT_FOUND_IN_METADATA',
    ERR_SUBJECT_NOT_FOUND_IN_METADATA = 'ERR_SUBJECT_NOT_FOUND_IN_METADATA',
    ERR_NO_KNOWN_PARTITION = 'ERR_NO_KNOWN_PARTITION',
    ERR_NO_KNOWN_LEADER_FOR_PARTITION = 'ERR_NO_KNOWN_LEADER_FOR_PARTITION',
}

/**
 * @hidden
 */
enum MessageErrorCodes {
    ERR_MESSAGE_MISSING_ENVELOPE_HEADER = 'ERR_MESSAGE_MISSING_ENVELOPE_HEADER',
    ERR_MESSAGE_UNEXPECTED_ENVELOPE_MAGIC_NUMBER = 'ERR_MESSAGE_UNEXPECTED_ENVELOPE_MAGIC_NUMBER',
    ERR_MESSAGE_UNKNOWN_ENVELOPE_PROTOCOL = 'ERR_MESSAGE_UNKNOWN_ENVELOPE_PROTOCOL',
}

/**
 * Liftbridge error codes.
 *
 * All errors include a `code` field that will include a unique
 * code for the error which can be handled gracefully.
 *
 * @example Handling a custom error.
 * ```typescript
 * import LiftbridgeClient from 'liftbridge';
 * import { ErrorCodes } from 'liftbridge/errors';
 *
 * try {
 *      const client = new LiftbridgeClient([]);
 * } catch (err) {
 *      if (err.code === ErrorCodes.ERR_NO_ADDRESSES) {
 *          // NoAddressesError thrown. Now handle this.
 *      }
 * }
 * ```
 *
 * @category Error
 */
export const ErrorCodes = {
    ...ConnectionErrorCodes,
    ...CreateStreamErrorCodes,
    ...SubscribeErrorCodes,
    ...MetadataErrorCodes,
    ...MessageErrorCodes,
};

/**
 * Base Error classes.
 */

/**
 * Connection Errors.
 * Master class for all errors from connectivity to the Liftbridge cluster.
 * @category Error
 */
class ConnectionError extends Error {
    constructor(public message: string = 'Unexpected error while connecting to Liftbridge server(s)', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ConnectionError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * CreateStream Errors.
 * Master class for all errors from creating a Liftbridge stream.
 * @category Error
 */
class CreateStreamError extends Error {
    constructor(public message: string = 'Unexpected error while creating Liftbridge stream', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'CreateStreamError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * Subscribe Errors.
 * Master class for all errors from subscribing to subjects on a Liftbridge cluster.
 * @category Error
 */
class SubscribeError extends Error {
    constructor(public message: string = 'Unexpected error while subscribing to stream', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'SubscribeError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * Metadata Errors.
 * Master class for all errors from fetching stream/partition metadata from a Liftbridge cluster.
 * @category Error
 */
class MetadataError extends Error {
    constructor(public message: string = 'Unexpected error while fetching metadata for Liftbridge stream', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'MetadataError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * Message Errors.
 * Master class for all errors from reading messages from a Liftbridge subject.
 * @category Error
 */
class MessageError extends Error {
    constructor(public message: string = 'Unexpected error while reading message from Liftbridge subject', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'MessageError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * Error classes.
 */

/**
 * @category Error
 */
export class NoAddressesError extends ConnectionError {
    name = 'NoAddressesError';

    message = 'No cluster addresses to connect to!';

    code = ConnectionErrorCodes.ERR_NO_ADDRESSES;
}

/**
 * @category Error
 */
export class CouldNotConnectToAnyServerError extends ConnectionError {
    name = 'CouldNotConnectToAnyServerError';

    message = 'Could not connect to any of the given addresses!';

    code = ConnectionErrorCodes.ERR_COULD_NOT_CONNECT;
}

/**
 * @category Error
 */
export class DeadlineExceededError extends ConnectionError {
    name = 'DeadlineExceededError';

    message = 'Could not get back a response within the deadline!';

    code = ConnectionErrorCodes.ERR_DEADLINE_EXCEEDED;
}

/**
 * @category Error
 */
export class PartitionAlreadyExistsError extends CreateStreamError {
    name = 'PartitionAlreadyExistsError';

    message = 'Partition already exists!';

    code = CreateStreamErrorCodes.ERR_PARTITION_ALREADY_EXISTS;
}

/**
 * @category Error
 */
export class InvalidPartitionsError extends CreateStreamError {
    name = 'InvalidPartitionsError';

    message = 'Invalid number of stream partitions! Partitions should be equal to or greater than zero.';

    code = CreateStreamErrorCodes.ERR_INVALID_PARTITIONS;
}

/**
 * @category Error
 */
export class NoSuchPartitionError extends SubscribeError {
    name = 'NoSuchPartitionrror';

    message = 'No such partition exists!';

    code = SubscribeErrorCodes.ERR_PARTITION_DOES_NOT_EXIST;
}

/**
 * @category Error
 */
export class OffsetNotSpecifiedError extends SubscribeError {
    name = 'OffsetNotSpecifiedError';

    message = 'Offset must be specified when startPosition is set to OFFSET!';

    code = SubscribeErrorCodes.ERR_OFFSET_NOT_SPECIFIED;
}

/**
 * @category Error
 */
export class TimestampNotSpecifiedError extends SubscribeError {
    name = 'TimestampNotSpecifiedError';

    message = 'Start timestamp must be specified when startPosition is set to TIMESTAMP!';

    code = SubscribeErrorCodes.ERR_TIMESTAMP_NOT_SPECIFIED;
}

/**
 * @category Error
 */
export class StreamNotFoundInMetadataError extends MetadataError {
    name = 'StreamNotFoundInMetadataError';

    message = 'No matching stream found in metadata!';

    code = MetadataErrorCodes.ERR_STREAM_NOT_FOUND_IN_METADATA;
}

/**
 * @category Error
 */
export class SubjectNotFoundInMetadataError extends MetadataError {
    name = 'SubjectNotFoundInMetadataError';

    message = 'No matching subject found in metadata!';

    code = MetadataErrorCodes.ERR_SUBJECT_NOT_FOUND_IN_METADATA;
}

/**
 * @category Error
 */
export class NoKnownPartitionError extends MetadataError {
    name = 'NoKnownPartitionError';

    message = 'No known partitions in metadata!';

    code = MetadataErrorCodes.ERR_NO_KNOWN_PARTITION;
}

/**
 * @category Error
 */
export class NoKnownLeaderForPartitionError extends MetadataError {
    name = 'NoKnownLeaderForPartitionError';

    message = 'No known leader for partition!';

    code = MetadataErrorCodes.ERR_NO_KNOWN_LEADER_FOR_PARTITION;
}

/**
 * @category Error
 */
export class MissingEnvelopeHeaderError extends MessageError {
    name = 'MissingEnvelopeHeaderError';

    message = 'Data missing envelope header!';

    code = MessageErrorCodes.ERR_MESSAGE_MISSING_ENVELOPE_HEADER;
}

export class UnexpectedEnvelopeMagicNumberError extends MessageError {
    name = 'UnexpectedEnvelopeMagicNumberError';

    message = 'Unexpected envelope magic number!';

    code = MessageErrorCodes.ERR_MESSAGE_UNEXPECTED_ENVELOPE_MAGIC_NUMBER;
}

export class UnknownEnvelopeProtocolError extends MessageError {
    name = 'UnknownEnvelopeProtocolError';

    message = 'Unknown envelope protocol!';

    code = MessageErrorCodes.ERR_MESSAGE_UNEXPECTED_ENVELOPE_MAGIC_NUMBER;
}
