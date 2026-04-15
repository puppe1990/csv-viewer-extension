const { parseJSON, parseJSONAsync } = require('../shared/json-utils');

describe('parseJSON', () => {
  test('parses array of objects', () => {
    const result = parseJSON('[{"name":"John","age":30},{"name":"Jane","age":25}]');
    expect(result.headers).toEqual(['name', 'age']);
    expect(result.rows).toEqual([
      ['John', '30'],
      ['Jane', '25']
    ]);
  });

  test('parses array of arrays', () => {
    const result = parseJSON('[["name","age"],["John",30],["Jane",25]]');
    expect(result.headers).toEqual(['0', '1']);
    expect(result.rows).toEqual([
      ['name', 'age'],
      ['John', '30'],
      ['Jane', '25']
    ]);
  });

  test('parses array of primitives', () => {
    const result = parseJSON('[1,2,3]');
    expect(result.headers).toEqual(['value']);
    expect(result.rows).toEqual([
      ['1'],
      ['2'],
      ['3']
    ]);
  });

  test('handles null values', () => {
    const result = parseJSON('[{"name":"John","age":null}]');
    expect(result.rows).toEqual([
      ['John', '']
    ]);
  });

  test('handles empty array', () => {
    const result = parseJSON('[]');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  test('parses non-array JSON as a single row', () => {
    const result = parseJSON('{"a":1}');
    expect(result.headers).toEqual(['a']);
    expect(result.rows).toEqual([['1']]);
  });

  test('throws on invalid JSON', () => {
    expect(() => parseJSON('not valid json')).toThrow('Invalid JSON format');
  });

  test('normalizes row lengths', () => {
    const result = parseJSON('[{"a":1,"b":2,"c":3},{"a":4}]');
    expect(result.headers).toEqual(['a', 'b', 'c']);
    expect(result.rows).toEqual([
      ['1', '2', '3'],
      ['4', '', '']
    ]);
  });

  test('uses union of keys from array objects', () => {
    const result = parseJSON('[{"a":1},{"b":2,"a":3}]');
    expect(result.headers).toEqual(['a', 'b']);
    expect(result.rows).toEqual([
      ['1', ''],
      ['3', '2']
    ]);
  });

  test('parses root object as a single row', () => {
    const result = parseJSON('{"name":"John","age":30}');
    expect(result.headers).toEqual(['name', 'age']);
    expect(result.rows).toEqual([['John', '30']]);
  });

  test('parses root object with data array', () => {
    const result = parseJSON('{"data":[{"name":"John"},{"name":"Jane"}],"total":2}');
    expect(result.headers).toEqual(['name']);
    expect(result.rows).toEqual([
      ['John'],
      ['Jane']
    ]);
  });

  test('serializes nested JSON values inside cells', () => {
    const result = parseJSON('[{"id":1,"meta":{"active":true},"tags":["a","b"]}]');
    expect(result.headers).toEqual(['id', 'meta', 'tags']);
    expect(result.rows).toEqual([
      ['1', '{"active":true}', '["a","b"]']
    ]);
  });
});

describe('parseJSONAsync', () => {
  test('parses JSON asynchronously', async () => {
    const result = await parseJSONAsync('[{"a":"1"},{"a":"2"}]');
    expect(result.headers).toEqual(['a']);
    expect(result.rows).toEqual([['1'], ['2']]);
  });

  test('reports progress', async () => {
    const progressCalls = [];
    await parseJSONAsync('[{"a":1},{"a":2}]', {
      onProgress: (p) => progressCalls.push(p)
    });
    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[progressCalls.length - 1]).toBe(100);
  });

  test('handles empty input', async () => {
    const result = await parseJSONAsync('');
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });
});
