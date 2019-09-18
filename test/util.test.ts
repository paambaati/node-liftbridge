import test from 'tape';
import { constructAddress } from '../src/utils';

test('🧰 Utility — `constructAddress()` should, well, construct an address.', async t => {
    t.plan(1);
    const address = constructAddress('localhost', 4200);
    t.equal(address, 'localhost:4200', 'should construct correctly.');
    t.end();
});
