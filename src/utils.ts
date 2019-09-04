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
