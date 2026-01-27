/**
 * Base repository class providing shared utilities for MongoDB repositories.
 * Contains common error handling, ID conversion, and entity mapping logic.
 */
export abstract class BaseRepository {
  /**
   * Checks if an error is an invalid ObjectId CastError.
   * When an invalid ObjectId format is provided to MongoDB queries,
   * it throws a CastError. This method identifies such errors.
   *
   * @param error - The error to check
   * @returns True if the error is an ObjectId CastError
   */
  protected isInvalidIdError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error.name === 'CastError' ||
        error.name === 'BSONTypeError' ||
        (error as any).kind === 'ObjectId') &&
      error.message.includes('ObjectId')
    );
  }

  /**
   * Checks if an error is a duplicate key error (MongoCode 11000).
   * Occurs when attempting to insert a document that violates a unique index.
   *
   * @param error - The error to check
   * @returns True if the error is a duplicate key error
   */
  protected isDuplicateKeyError(error: unknown): boolean {
    return (
      error instanceof Error &&
      (error as any).code === 11000
    );
  }

  /**
   * Checks if an error is a validation error from Mongoose.
   * Occurs when document validation fails during save or update.
   *
   * @param error - The error to check
   * @returns True if the error is a validation error
   */
  protected isValidationError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.name === 'ValidationError'
    );
  }

  /**
   * Converts a MongoDB ObjectId or string to string.
   * Handles null/undefined values gracefully.
   *
   * @param id - The ObjectId or string to convert
   * @returns String representation of the ID, or undefined if null/undefined
   */
  protected idToString(id: unknown): string | undefined {
    if (id === null || id === undefined) {
      return undefined;
    }
    return id.toString();
  }

  /**
   * Safely gets a Date value from an unknown source.
   *
   * @param value - The value to convert to Date
   * @returns Date object or undefined
   */
  protected toDate(value: unknown): Date | undefined {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }

  /**
   * Safely gets a string array value from an unknown source.
   *
   * @param value - The value to convert to string array
   * @returns String array or undefined
   */
  protected toStringArray(value: unknown): string[] | undefined {
    if (Array.isArray(value)) {
      const filtered = value.filter((v): v is string => typeof v === 'string');
      return filtered.length > 0 ? filtered : undefined;
    }
    return undefined;
  }

  /**
   * Safely gets a Map value from an unknown source.
   * Handles MongoDB Map serialization.
   *
   * @param value - The value to convert to Map
   * @returns Map object or undefined
   */
  protected toMap<V = unknown>(value: unknown): Map<string, V> | undefined {
    if (value instanceof Map) {
      return value as Map<string, V>;
    }
    if (typeof value === 'object' && value !== null) {
      try {
        return new Map(Object.entries(value as Record<string, V>));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Converts a Map to a plain object for MongoDB storage.
   *
   * @param map - The Map to convert
   * @returns Plain object or undefined
   */
  protected mapToObject<K extends string, V>(
    map: Map<K, V> | undefined
  ): Record<string, V> | undefined {
    if (!map) {
      return undefined;
    }
    const obj: Record<string, V> = {};
    map.forEach((value, key) => {
      obj[key as string] = value;
    });
    return Object.keys(obj).length > 0 ? obj : undefined;
  }
}
