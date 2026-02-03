/**
 * API Response Utilities Tests
 */

import { describe, it, expect } from '@jest/globals';
import { successResponse, errorResponse, errors } from './response';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const data = { id: '1', name: 'Test' };
      const response = successResponse(data);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toBeDefined();
    });

    it('should create a success response with custom status', () => {
      const data = { id: '1' };
      const response = successResponse(data, undefined, 201);

      expect(response.status).toBe(201);
    });

    it('should include metadata in response', () => {
      const data = [1, 2, 3];
      const meta = { page: 1, limit: 10, total: 3 };
      const response = successResponse(data, meta);

      expect(response.status).toBe(200);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with code and message', () => {
      const response = errorResponse('TEST_ERROR', 'Test error message', 400);

      expect(response.status).toBe(400);
    });

    it('should include details when provided', () => {
      const details = { field: 'value' };
      const response = errorResponse('TEST_ERROR', 'Test error', 400, details);

      expect(response.status).toBe(400);
    });
  });

  describe('errors helper', () => {
    it('should create unauthorized error', () => {
      const response = errors.unauthorized();
      expect(response.status).toBe(401);
    });

    it('should create forbidden error', () => {
      const response = errors.forbidden();
      expect(response.status).toBe(403);
    });

    it('should create not found error with resource name', () => {
      const response = errors.notFound('User');
      expect(response.status).toBe(404);
    });

    it('should create bad request error', () => {
      const response = errors.badRequest('Invalid input');
      expect(response.status).toBe(400);
    });

    it('should create conflict error', () => {
      const response = errors.conflict('Resource already exists');
      expect(response.status).toBe(409);
    });

    it('should create internal server error', () => {
      const response = errors.internal();
      expect(response.status).toBe(500);
    });

    it('should create validation failed error', () => {
      const fieldErrors = {
        name: ['Name is required'],
        email: ['Invalid email format'],
      };
      const response = errors.validationFailed(fieldErrors);
      expect(response.status).toBe(400);
    });

    it('should create rate limited error', () => {
      const response = errors.rateLimited();
      expect(response.status).toBe(429);
    });
  });
});
