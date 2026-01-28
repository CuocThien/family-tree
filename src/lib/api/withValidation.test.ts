/**
 * API Validation Middleware Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withValidation } from './withValidation';

// Mock NextRequest
function createMockRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe('withValidation', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
    email: z.string().email().optional(),
  });

  it('should return data when validation passes', async () => {
    const request = createMockRequest({
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    });

    const validate = withValidation(testSchema);
    const result = await validate(request);

    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.age).toBe(30);
      expect(result.data.email).toBe('john@example.com');
    }
  });

  it('should return data when optional fields are missing', async () => {
    const request = createMockRequest({
      name: 'Jane Doe',
      age: 25,
    });

    const validate = withValidation(testSchema);
    const result = await validate(request);

    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.age).toBe(25);
      expect(result.data.email).toBeUndefined();
    }
  });

  it('should return error response when validation fails', async () => {
    const request = createMockRequest({
      name: '',
      age: -5,
    });

    const validate = withValidation(testSchema);
    const result = await validate(request);

    expect(result instanceof Response).toBe(true);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
    }
  });

  it('should return error response for invalid JSON', async () => {
    const request = {
      json: async () => {
        throw new Error('Invalid JSON');
      },
    } as unknown as NextRequest;

    const validate = withValidation(testSchema);
    const result = await validate(request);

    expect(result instanceof Response).toBe(true);
    if (result instanceof Response) {
      expect(result.status).toBe(400);
    }
  });
});
