import { backOff, IBackOffOptions } from 'exponential-backoff';

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
    for (let i = arrayCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
}

/**
 * Execute the `Promise` wrapped inside a function with retry, exponential backoff & [jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/).
 *
 * @param call Function returning a `Promise` that you want to retry.
 * @param retryOptions Retry & exponential backoff options.
 */
export function faultTolerantCall<T>(call: () => Promise<T>, retryOptions: Partial<IBackOffOptions>): Promise<T> {
    return backOff(call, retryOptions);
}
