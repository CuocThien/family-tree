import { Model } from 'mongoose';
import { PersonModel, IPersonDocument } from '@/models/Person';
import {
  IPersonRepository,
  PersonQueryOptions,
  PersonSearchCriteria,
} from '@/repositories/interfaces/IPersonRepository';
import { IPerson, CreatePersonData, UpdatePersonData } from '@/types/person';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';
import { NotFoundError } from '@/services/errors/ServiceErrors';

/**
 * MongoDB implementation of IPersonRepository.
 * Handles CRUD operations for Person entities with proper error handling
 * and type conversions between domain models and MongoDB documents.
 */
export class PersonRepository extends BaseRepository implements IPersonRepository {
  constructor(private model: Model<IPersonDocument> = PersonModel) {
    super();
  }

  async findById(id: string): Promise<IPerson | null> {
    try {
      const doc = await this.model.findById(id).lean().exec();
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      if (this.isInvalidIdError(error)) {
        return null;
      }
      throw error;
    }
  }

  async findByTreeId(
    treeId: string,
    options: PersonQueryOptions = {}
  ): Promise<IPerson[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'lastName',
      sortOrder = 'asc',
    } = options;

    const treeObjectId = new mongoose.Types.ObjectId(treeId);

    const docs = await this.model
      .find({ treeId: treeObjectId })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async create(data: CreatePersonData): Promise<IPerson> {
    // Convert Map to plain object for MongoDB storage
    const createData: Record<string, unknown> = {
      ...data,
      treeId: new mongoose.Types.ObjectId(data.treeId),
      customAttributes: this.mapToStringMap(data.customAttributes),
      photos: data.photos ?? [],
      documents: data.documents ?? [],
    };

    const doc = await this.model.create(createData);
    // Handle both Mongoose documents (with toObject) and plain objects
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async update(id: string, data: UpdatePersonData): Promise<IPerson> {
    // Convert Map to plain object for MongoDB storage
    const updateData: Record<string, unknown> = {
      ...data,
      customAttributes: this.mapToStringMap(data.customAttributes),
    };

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new NotFoundError('Person', id);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async search(
    treeId: string,
    criteria: PersonSearchCriteria
  ): Promise<IPerson[]> {
    const query: Record<string, unknown> = {
      treeId: new mongoose.Types.ObjectId(treeId),
    };

    if (criteria.firstName) {
      query.firstName = { $regex: this.sanitizeRegexInput(criteria.firstName), $options: 'i' };
    }
    if (criteria.lastName) {
      query.lastName = { $regex: this.sanitizeRegexInput(criteria.lastName), $options: 'i' };
    }
    if (criteria.birthYear) {
      query.dateOfBirth = {
        $gte: new Date(criteria.birthYear, 0, 1),
        $lt: new Date(criteria.birthYear + 1, 0, 1),
      };
    }
    if (criteria.deathYear) {
      query.dateOfDeath = {
        $gte: new Date(criteria.deathYear, 0, 1),
        $lt: new Date(criteria.deathYear + 1, 0, 1),
      };
    }
    if (criteria.isLiving !== undefined) {
      // Determine isLiving based on presence of dateOfDeath
      // If isLiving is true, we want documents without dateOfDeath
      // If isLiving is false, we want documents with dateOfDeath
      query.dateOfDeath = criteria.isLiving ? { $exists: false } : { $exists: true };
    }

    const docs = await this.model.find(query).lean().exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async countByTreeId(treeId: string): Promise<number> {
    return this.model
      .countDocuments({ treeId: new mongoose.Types.ObjectId(treeId) })
      .exec();
  }

  async findByIds(ids: string[]): Promise<IPerson[]> {
    if (ids.length === 0) return [];

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));

    const docs = await this.model
      .find({ _id: { $in: objectIds } })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.model
        .countDocuments({ _id: new mongoose.Types.ObjectId(id) })
        .exec();
      return count > 0;
    } catch {
      return false;
    }
  }

  async existsInTree(id: string, treeId: string): Promise<boolean> {
    try {
      const count = await this.model
        .countDocuments({
          _id: new mongoose.Types.ObjectId(id),
          treeId: new mongoose.Types.ObjectId(treeId),
        })
        .exec();
      return count > 0;
    } catch {
      return false;
    }
  }

  async deleteByTreeId(treeId: string): Promise<number> {
    const result = await this.model
      .deleteMany({ treeId: new mongoose.Types.ObjectId(treeId) })
      .exec();
    return result.deletedCount || 0;
  }

  /**
   * Sanitizes user input for safe use in MongoDB regex queries.
   * Escapes regex special characters to prevent NoSQL injection attacks.
   * @param input - The user input string to sanitize
   * @returns A sanitized string safe for use in regex patterns
   */
  private sanitizeRegexInput(input: string): string {
    // Escape all regex special characters: . * + ? ^ $ { } ( ) | [ ] \
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Converts a MongoDB document to a domain entity (IPerson).
   * Handles type conversions including ObjectId to string.
   */
  private toEntity(doc: IPersonDocument | ReturnType<IPersonDocument['toObject']>): IPerson {
    const docRecord = doc as Record<string, unknown>;
    return {
      _id: this.idToString(docRecord._id)!,
      treeId: this.idToString(docRecord.treeId)!,
      firstName: docRecord.firstName as string,
      lastName: docRecord.lastName as string,
      middleName: docRecord.middleName as string | undefined,
      dateOfBirth: this.toDate(docRecord.dateOfBirth),
      dateOfDeath: this.toDate(docRecord.dateOfDeath),
      gender: docRecord.gender as IPerson['gender'],
      biography: docRecord.biography as string | undefined,
      photos: (docRecord.photos as string[]) ?? [],
      documents: (docRecord.documents as string[]) ?? [],
      customAttributes: this.toMap(docRecord.customAttributes) ?? new Map<string, string | number | boolean>(),
      createdAt: docRecord.createdAt as Date,
      updatedAt: docRecord.updatedAt as Date,
    };
  }

  /**
   * Converts a Map to a plain object for MongoDB Map storage.
   * MongoDB stores Maps as objects, but we need to ensure proper format.
   */
  private mapToStringMap(
    map: Map<string, string | number | boolean> | undefined
  ): Record<string, string | number | boolean> | undefined {
    if (!map || map.size === 0) {
      return undefined;
    }
    const obj: Record<string, string | number | boolean> = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }
}
