import { readFile as read } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(read);

/**
 * Read file asynchronously.
 *
 * @example Reading file using `readFile()` function.
 * ```
 * const contents = await readFile('/tmp/example.txt');
 * console.log(contents); // Prints contents of /tmp/example.txt
 * ```
 * @param filename - Filename to read.
 * @param encoding - (Optional) file encoding; defaults to 'utf8'.
 * @returns File contents as string.
 */
export default async function readFile(filename: string, encoding: string = 'utf8'): Promise<string> {
    const absolutePath = resolve(join(__dirname, '../', filename));
    return readFileAsync(absolutePath, { encoding });
}
