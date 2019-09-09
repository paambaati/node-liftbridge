import { backOff, IBackOffOptions } from 'exponential-backoff';
import { JitterTypes } from 'exponential-backoff/dist/options';

/**
 * Randomly shuffles an array.
 *
 * Simple implementation of Durstenfeld shuffle,
 * which is a computer-ready implementation of the [Fisher-Yates shuffle](https://wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm).
 *
 * @param array Array of items to shuffle.
 */
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
 * Defaults to 5 retries, full jitter, backoff multiple of 1.5 and no starting delay.
 *
 * @param call Function returning a `Promise` that you want to retry.
 * @param retryOptions Retry & exponential backoff options (has own defaults - read source).
 */
export function faultTolerantCall<T>(call: () => Promise<T>, retryOptions?: Partial<IBackOffOptions>): Promise<T> {
    const retryDefaults: Partial<IBackOffOptions> = {
        delayFirstAttempt: false,
        numOfAttempts: 5,
        jitter: JitterTypes.Full,
        startingDelay: 0,
        timeMultiple: 1.5,
    };
    return backOff(call, Object.assign(retryOptions || {}, retryDefaults));
}
