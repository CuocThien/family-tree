import { Model } from 'mongoose';
import { AuditLogModel, IAuditLogDocument } from '@/models/AuditLog';
import {
  IAuditRepository,
  AuditQueryOptions,
} from '@/repositories/interfaces/IAuditRepository';
import { IAuditLog, CreateAuditLogData } from '@/types/audit';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of IAuditRepository.
 * Handles audit log operations (create-only, no updates or deletes).
 */
export class AuditRepository extends BaseRepository implements IAuditRepository {
  constructor(private model: Model<IAuditLogDocument> = AuditLogModel) {
    super();
  }

  async create(data: CreateAuditLogData): Promise<IAuditLog> {
    const createData = {
      treeId: new mongoose.Types.ObjectId(data.treeId),
      userId: new mongoose.Types.ObjectId(data.userId),
      action: data.action,
      entityType: data.entityType,
      entityId: new mongoose.Types.ObjectId(data.entityId),
      changes: data.changes || [],
      timestamp: new Date(),
    };

    const doc = await this.model.create(createData);
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async findByTreeId(treeId: string, options: AuditQueryOptions = {}): Promise<IAuditLog[]> {
    const {
      limit = 100,
      offset = 0,
      action,
      entityType,
      startDate,
      endDate,
    } = options;

    const query: Record<string, unknown> = {
      treeId: new mongoose.Types.ObjectId(treeId),
    };

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.timestamp = {} as Record<string, Date>;
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    const docs = await this.model
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findByUserId(userId: string, options: AuditQueryOptions = {}): Promise<IAuditLog[]> {
    const {
      limit = 100,
      offset = 0,
      action,
      entityType,
      startDate,
      endDate,
    } = options;

    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.timestamp = {} as Record<string, Date>;
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    const docs = await this.model
      .find(query)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findByEntityId(entityType: string, entityId: string): Promise<IAuditLog[]> {
    const docs = await this.model
      .find({
        entityType: entityType as IAuditLog['entityType'],
        entityId: new mongoose.Types.ObjectId(entityId),
      })
      .sort({ timestamp: -1 })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async countByTreeId(treeId: string, options: AuditQueryOptions = {}): Promise<number> {
    const { action, entityType, startDate, endDate } = options;

    const query: Record<string, unknown> = {
      treeId: new mongoose.Types.ObjectId(treeId),
    };

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (startDate || endDate) {
      query.timestamp = {} as Record<string, Date>;
      if (startDate) {
        (query.timestamp as Record<string, Date>).$gte = startDate;
      }
      if (endDate) {
        (query.timestamp as Record<string, Date>).$lte = endDate;
      }
    }

    return this.model.countDocuments(query).exec();
  }

  async archiveOlderThan(date: Date): Promise<number> {
    // In a real implementation, this might move logs to a separate archive collection
    // For now, we'll just delete them
    const result = await this.model
      .deleteMany({
        timestamp: { $lt: date },
      })
      .exec();

    return result.deletedCount || 0;
  }

  private toEntity(doc: any): IAuditLog {
    const changes = doc.changes as Array<{ field: string; oldValue: unknown; newValue: unknown }>;

    return {
      _id: this.idToString(doc._id)!,
      treeId: this.idToString(doc.treeId)!,
      userId: this.idToString(doc.userId)!,
      action: doc.action as IAuditLog['action'],
      entityType: doc.entityType as IAuditLog['entityType'],
      entityId: this.idToString(doc.entityId)!,
      changes: changes || [],
      timestamp: doc.timestamp as Date,
    };
  }
}
