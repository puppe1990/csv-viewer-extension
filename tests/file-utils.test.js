const { readFileAsText, readFileAsArrayBuffer } = require('../shared/file-utils');

describe('readFileAsText', () => {
  let mockFile;
  let mockFileReader;

  beforeEach(() => {
    mockFileReader = {
      readAsText: jest.fn(),
      onload: null,
      onerror: null,
      onprogress: null,
      result: null,
      error: null
    };

    global.FileReader = jest.fn(() => mockFileReader);

    mockFile = new Blob(['test content'], { type: 'text/plain' });
  });

  test('reads file as text', async () => {
    mockFileReader.result = 'test content';

    const promise = readFileAsText(mockFile);
    
    mockFileReader.onload({ target: { result: 'test content' } });

    const result = await promise;
    expect(result).toBe('test content');
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile, 'UTF-8');
  });

  test('uses custom encoding', async () => {
    const promise = readFileAsText(mockFile, 'ISO-8859-1');
    mockFileReader.onload({ target: { result: 'content' } });
    
    await promise;
    expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile, 'ISO-8859-1');
  });

  test('calls onProgress callback', async () => {
    const onProgress = jest.fn();
    
    const promise = readFileAsText(mockFile, 'UTF-8', onProgress);
    
    // Simulate progress event
    const mockEvent = { loaded: 50, total: 100 };
    mockFileReader.onprogress(mockEvent);
    
    mockFileReader.onload({ target: { result: 'content' } });
    await promise;
    
    expect(onProgress).toHaveBeenCalledWith(mockEvent);
  });

  test('rejects on error', async () => {
    const promise = readFileAsText(mockFile);
    
    mockFileReader.onerror();
    
    await expect(promise).rejects.toBe(mockFileReader.error);
  });
});

describe('readFileAsArrayBuffer', () => {
  let mockFile;
  let mockFileReader;

  beforeEach(() => {
    mockFileReader = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      onerror: null,
      onprogress: null,
      result: null,
      error: null
    };

    global.FileReader = jest.fn(() => mockFileReader);

    mockFile = new Blob(['test content'], { type: 'text/plain' });
  });

  test('reads file as array buffer', async () => {
    const mockBuffer = new ArrayBuffer(8);
    mockFileReader.result = mockBuffer;

    const promise = readFileAsArrayBuffer(mockFile);
    
    mockFileReader.onload({ target: { result: mockBuffer } });

    const result = await promise;
    expect(result).toBe(mockBuffer);
    expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);
  });

  test('calls onProgress callback', async () => {
    const onProgress = jest.fn();
    
    const promise = readFileAsArrayBuffer(mockFile, onProgress);
    
    // Simulate progress event
    const mockEvent = { loaded: 50, total: 100 };
    mockFileReader.onprogress(mockEvent);
    
    mockFileReader.onload({ target: { result: new ArrayBuffer(8) } });
    await promise;
    
    expect(onProgress).toHaveBeenCalledWith(mockEvent);
  });

  test('rejects on error', async () => {
    const promise = readFileAsArrayBuffer(mockFile);
    
    mockFileReader.onerror();
    
    await expect(promise).rejects.toBe(mockFileReader.error);
  });
});
