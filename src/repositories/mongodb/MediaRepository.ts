import { Model } from 'mongoose';
import { MediaModel, IMediaDocument } from '@/models/Media';
import {
  IMediaRepository,
  MediaQueryOptions,
} from '@/repositories/interfaces/IMediaRepository';
import { IMedia, CreateMediaData, UpdateMediaData } from '@/types/media';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of IMediaRepository.
 * Handles CRUD operations for Media entities.
 */
export class MediaRepository extends BaseRepository implements IMediaRepository {
  constructor(private model: Model<IMediaDocument> = MediaModel) {
    super();
  }

  async findById(id: string): Promise<IMedia | null> {
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

  async findByTreeId(treeId: string, options: MediaQueryOptions = {}): Promise<IMedia[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
    } = options;

    const query: Record<string, unknown> = {
      treeId: new mongoose.Types.ObjectId(treeId),
    };

    if (type) {
      query.type = type;
    }

    const docs = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findByPersonId(personId: string, options: MediaQueryOptions = {}): Promise<IMedia[]> {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
    } = options;

    const query: Record<string, unknown> = {
      personId: new mongoose.Types.ObjectId(personId),
    };

    if (type) {
      query.type = type;
    }

    const docs = await this.model
      .find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async create(data: CreateMediaData): Promise<IMedia> {
    const createData = {
      ...data,
      treeId: new mongoose.Types.ObjectId(data.treeId),
      personId: data.personId ? new mongoose.Types.ObjectId(data.personId) : undefined,
      metadata: data.metadata || {},
    };

    const doc = await this.model.create(createData);
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async update(id: string, data: UpdateMediaData): Promise<IMedia> {
    const updateData: Record<string, unknown> = {};

    if (data.personId !== undefined) {
      updateData.personId = data.personId
        ? new mongoose.Types.ObjectId(data.personId)
        : null;
    }

    if (data.metadata) {
      if (data.metadata.width !== undefined) {
        updateData['metadata.width'] = data.metadata.width;
      }
      if (data.metadata.height !== undefined) {
        updateData['metadata.height'] = data.metadata.height;
      }
      if (data.metadata.location !== undefined) {
        updateData['metadata.location'] = data.metadata.location;
      }
      if (data.metadata.dateTaken !== undefined) {
        updateData['metadata.dateTaken'] = data.metadata.dateTaken;
      }
      if (data.metadata.description !== undefined) {
        updateData['metadata.description'] = data.metadata.description;
      }
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`Media with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async findByStorageKey(storageKey: string): Promise<IMedia | null> {
    // Assuming url contains the storage key
    const doc = await this.model.findOne({ url: storageKey }).lean().exec();
    return doc ? this.toEntity(doc) : null;
  }

  async deleteByPersonId(personId: string): Promise<number> {
    const result = await this.model
      .deleteMany({
        personId: new mongoose.Types.ObjectId(personId),
      })
      .exec();

    return result.deletedCount || 0;
  }

  async deleteByTreeId(treeId: string): Promise<number> {
    const result = await this.model
      .deleteMany({
        treeId: new mongoose.Types.ObjectId(treeId),
      })
      .exec();

    return result.deletedCount || 0;
  }

  async countByTreeId(treeId: string): Promise<number> {
    return this.model
      .countDocuments({ treeId: new mongoose.Types.ObjectId(treeId) })
      .exec();
  }

  async countByPersonId(personId: string): Promise<number> {
    return this.model
      .countDocuments({ personId: new mongoose.Types.ObjectId(personId) })
      .exec();
  }

  async getTotalSizeByTreeId(treeId: string): Promise<number> {
    const result = await this.model
      .aggregate([
        { $match: { treeId: new mongoose.Types.ObjectId(treeId) } },
        { $group: { _id: null, total: { $sum: '$size' } } },
      ])
      .exec();

    return result[0]?.total || 0;
  }

  private toEntity(doc: any): IMedia {
    const metadata = doc.metadata as any;

    return {
      _id: this.idToString(doc._id)!,
      treeId: this.idToString(doc.treeId)!,
      personId: this.idToString(doc.personId),
      type: doc.type as IMedia['type'],
      filename: doc.filename as string,
      mimeType: doc.mimeType as string,
      size: doc.size as number,
      url: doc.url as string,
      metadata: {
        width: metadata?.width,
        height: metadata?.height,
        location: metadata?.location,
        dateTaken: this.toDate(metadata?.dateTaken),
        description: metadata?.description,
      },
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
