/* istanbul ignore file */
/**
 * Custom errors.
 */

/**
 * Error code enums.
 */

export const enum ConnectionErrorCodes {
    ERR_NO_ADDRESSES_ERROR = 'ERR_NO_ADDRESSES_ERROR',
}

export const enum CreateStreamErrorCodes {
    ERR_STREAM_ALREADY_EXISTS_ERROR = 'ERR_STREAM_ALREADY_EXISTS_ERROR',
}

export const enum SubscribeErrorCodes {
    ERR_STREAM_DOES_NOT_EXIST_ERROR = 'ERR_STREAM_DOES_NOT_EXIST_ERROR',
}

/**
 * Base Error classes.
 */

export class ConnectionError extends Error {
    constructor(public message: string = 'Unexpected error while connecting to Liftbridge server(s)') {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'ConnectionError';
        this.stack = new Error(message).stack;
        return this;
    }
}

export class CreateStreamError extends Error {
    constructor(public message: string = 'Unexpected error while creating Liftbridge stream') {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'CreateStreamError';
        this.stack = new Error(message).stack;
        return this;
    }
}

export class SubscribeError extends Error {
    constructor(public message: string = 'Unexpected error while subscribing to stream') {
        super();
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = 'SubscribeError';
        this.stack = new Error(message).stack;
        return this;
    }
}

/**
 * Error classes.
 */

export class NoAddressesError extends CreateStreamError {
    name = 'NoAddressesError';
    message = 'No cluster addresses to connect to!';
}

export class StreamAlreadyExistsError extends CreateStreamError {
    name = 'StreamAlreadyExistsError';
    message = 'Stream already exists!';
}

export class InvalidPartitionsError extends CreateStreamError {
    name = 'InvalidPartitionsError';
    message = `Invalid number of stream partitions! Partitions should be equal to or greater than zero.`;
}

export class NoSuchStreamError extends SubscribeError {
    name = 'NoSuchStreamError';
    message = 'No such stream exists!';
}
