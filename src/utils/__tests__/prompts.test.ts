import { parseAPIResponse } from '../prompts';

describe('parseAPIResponse', () => {
  it('should parse a valid JSON string', () => {
    const jsonString = '{"success": true, "results": []}';
    const result = parseAPIResponse(jsonString);
    expect(result).toEqual({ success: true, results: [] });
  });

  it('should parse a JSON string with leading/trailing whitespace', () => {
    const jsonString = '  {"success": true, "results": []}  ';
    const result = parseAPIResponse(jsonString);
    expect(result).toEqual({ success: true, results: [] });
  });

  it('should parse a JSON string wrapped in markdown code blocks', () => {
    const jsonString = '```json\n{"success": true, "results": []}\n```';
    const result = parseAPIResponse(jsonString);
    expect(result).toEqual({ success: true, results: [] });
  });

  it('should throw an error for an invalid JSON string', () => {
    const jsonString = '{"success": true, "results": [}';
    expect(() => parseAPIResponse(jsonString)).toThrow();
  });

  it('should throw an error for a string without a JSON object', () => {
    const jsonString = 'This is not a JSON string.';
    expect(() => parseAPIResponse(jsonString)).toThrow('No JSON object found in the response.');
  });

  it('should throw an error for a JSON object with missing required fields', () => {
    const jsonString = '{"data": "some data"}';
    expect(() => parseAPIResponse(jsonString)).toThrow('Invalid response format: missing required fields (success, results).');
  });
});