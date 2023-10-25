import { describe, it } from 'node:test';
import {strict as assert} from 'node:assert';
import { fromCdx } from './skbom.mjs';
import { readFileSync } from "fs";

const test1 = readFileSync('./test/test1.cdx.json', 'utf8');
const test1Expected = JSON.parse(readFileSync('./test/test1_expected.kbom.json', 'utf8'));
describe('fromCdx', () => {
  it('test1', () => {
    const result = fromCdx(test1);
    assert.equal(result, test1Expected);
  });
});
