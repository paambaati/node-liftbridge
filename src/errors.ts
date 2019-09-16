/* istanbul ignore file */
/**
 * Custom errors.
 */

/**
 * Error code enums.
 */

enum ConnectionErrorCodes {
    ERR_NO_ADDRESSES = 'ERR_NO_ADDRESSES',
    ERR_COULD_NOT_CONNECT = 'ERR_COULD_NOT_CONNECT',
    ERR_DEADLINE_EXCEEDED = 'ERR_DEADLINE_EXCEEDED',
}

enum CreateStreamErrorCodes {
    ERR_PARTITION_ALREADY_EXISTS = 'ERR_PARTITION_ALREADY_EXISTS',
    ERR_INVALID_PARTITIONS = 'ERR_INVALID_PARTITIONS',
}

enum SubscribeErrorCodes {
    ERR_PARTITION_DOES_NOT_EXIST = 'ERR_PARTITION_DOES_NOT_EXIST',
    ERR_OFFSET_NOT_SPECIFIED = 'ERR_OFFSET_NOT_SPECIFIED',
    ERR_TIMESTAMP_NOT_SPECIFIED = 'ERR_TIMESTAMP_NOT_SPECIFIED',
}

enum MetadataErrorCodes {
    ERR_STREAM_NOT_FOUND_IN_METADATA = 'ERR_STREAM_NOT_FOUND_IN_METADATA',
    ERR_SUBJECT_NOT_FOUND_IN_METADATA = 'ERR_SUBJECT_NOT_FOUND_IN_METADATA',
    ERR_NO_KNOWN_PARTITION = 'ERR_NO_KNOWN_PARTITION',
    ERR_NO_KNOWN_LEADER_FOR_PARTITION = 'ERR_NO_KNOWN_LEADER_FOR_PARTITION',
}

/**
 * Liftbridge error codes.
 *
 * @category Error
 */
export const ErrorCodes = {
    ...ConnectionErrorCodes,
    ...CreateStreamErrorCodes,
    ...SubscribeErrorCodes,
    ...MetadataErrorCodes,
};

/**
 * Base Error classes.
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

class CreateStreamError extends Error {
    constructor(public message: string = 'Unexpected error while creating Liftbridge stream', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'CreateStreamError';
        this.stack = new Error(message).stack;
        return this;
    }
}

class SubscribeError extends Error {
    constructor(public message: string = 'Unexpected error while subscribing to stream', public code?: string) {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'SubscribeError';
        this.stack = new Error(message).stack;
        return this;
    }
}

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
