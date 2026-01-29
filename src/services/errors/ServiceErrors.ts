/**
 * Custom error classes for service layer
 * Provides specific error types for better error handling
 */

// Array-based ValidationError for multiple validation errors
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  // Convenience method to create from single error message
  static fromMessage(message: string): ValidationError {
    return new ValidationError([message]);
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class BusinessRuleError extends Error {
  constructor(rule: string) {
    super(`Business rule violation: ${rule}`);
    this.name = 'BusinessRuleError';
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}
