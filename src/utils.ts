import { backOff, IBackOffOptions } from 'exponential-backoff';
import { JitterTypes } from 'exponential-backoff/dist/options';

/**
 * Randomly shuffles an array.
 *
 * Simple implementation of Durstenfeld shuffle,
 * which is a computer-ready implementation of the [Fisher-Yates shuffle](https://wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm).
 *
 * @param array Array of items to shuffle.
 * @returns Copy of original array in shuffled order.
 * @hidden
 */
/* istanbul ignore next */
export function shuffleArray(array: any[]) {
    const arrayCopy = array.slice();
    for (let i = arrayCopy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
}

/**
 * Execute the `Promise` wrapped inside a function with retry, exponential backoff & [jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/).
 * Defaults to 5 retries, full jitter, backoff multiple of 1.5 and a delay interval of 100 milliseconds.
 *
 * @param call Function returning a `Promise` that you want to retry.
 * @param retryOptions Retry & exponential backoff options (has own defaults - read source).
 * @returns A Promise that settles after all the retries are done.
 * @hidden
 */
/* istanbul ignore next */
export function faultTolerantCall<T>(call: () => Promise<T>, retryOptions?: Partial<IBackOffOptions>): Promise<T> {
    const retryDefaults: Partial<IBackOffOptions> = {
        delayFirstAttempt: false,
        numOfAttempts: 5,
        jitter: JitterTypes.Full,
        startingDelay: 100,
        timeMultiple: 1.5,
    };
    return backOff(call, Object.assign(retryDefaults, retryOptions || {}));
}

/**
 * Construct an address of the form <host>:<port>
 *
 * @param host Hostname.
 * @param port Port.
 * @returns Constructed address.
 * @hidden
 */
export function constructAddress(host: string, port: number): string {
    return `${host}:${port}`;
}
