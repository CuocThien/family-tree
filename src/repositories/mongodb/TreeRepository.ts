import { Model } from 'mongoose';
import { FamilyTreeModel, IFamilyTreeDocument, ICollaboratorDocument, ITreeSettingsDocument } from '@/models/FamilyTree';
import {
  ITreeRepository,
  TreeQueryOptions,
} from '@/repositories/interfaces/ITreeRepository';
import { ITree, CreateTreeData, UpdateTreeData, ICollaborator } from '@/types/tree';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of ITreeRepository.
 * Handles CRUD operations for FamilyTree entities with proper error handling
 * and type conversions between domain models and MongoDB documents.
 */
export class TreeRepository extends BaseRepository implements ITreeRepository {
  constructor(private model: Model<IFamilyTreeDocument> = FamilyTreeModel) {
    super();
  }

  async findById(id: string, options: TreeQueryOptions = {}): Promise<ITree | null> {
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

  async findByOwnerId(ownerId: string): Promise<ITree[]> {
    const docs = await this.model
      .find({ ownerId: new mongoose.Types.ObjectId(ownerId) })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findByCollaboratorId(userId: string): Promise<ITree[]> {
    const docs = await this.model
      .find({ 'collaborators.userId': new mongoose.Types.ObjectId(userId) })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async create(data: CreateTreeData): Promise<ITree> {
    const createData: Record<string, unknown> = {
      ...data,
      ownerId: new mongoose.Types.ObjectId(data.ownerId),
      rootPersonId: data.rootPersonId
        ? new mongoose.Types.ObjectId(data.rootPersonId)
        : undefined,
      collaborators: [],
      settings: {
        isPublic: data.settings?.isPublic ?? false,
        allowComments: data.settings?.allowComments ?? true,
        defaultPhotoQuality: data.settings?.defaultPhotoQuality ?? 'medium',
        language: data.settings?.language ?? 'en',
      },
    };

    const doc = await this.model.create(createData);
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async update(id: string, data: UpdateTreeData): Promise<ITree> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.rootPersonId !== undefined) {
      updateData.rootPersonId = data.rootPersonId
        ? new mongoose.Types.ObjectId(data.rootPersonId)
        : null;
    }
    if (data.settings) {
      updateData['settings.isPublic'] = data.settings.isPublic;
      updateData['settings.allowComments'] = data.settings.allowComments;
      updateData['settings.defaultPhotoQuality'] = data.settings.defaultPhotoQuality;
      updateData['settings.language'] = data.settings.language;
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`Tree with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async addCollaborator(treeId: string, collaborator: ICollaborator): Promise<ITree> {
    // First check if tree exists
    const existingTree = await this.findById(treeId);
    if (!existingTree) {
      throw new Error(`Tree with id ${treeId} not found`);
    }

    // Check if user is already a collaborator
    const isAlreadyCollaborator = existingTree.collaborators.some(
      (c) => c.userId === collaborator.userId
    );

    if (isAlreadyCollaborator) {
      // Update existing collaborator
      const doc = await this.model
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(treeId), 'collaborators.userId': new mongoose.Types.ObjectId(collaborator.userId) },
          {
            $set: {
              'collaborators.$.permission': collaborator.permission,
              'collaborators.$.addedAt': collaborator.addedAt,
            },
          },
          { new: true }
        )
        .lean()
        .exec();

      if (!doc) {
        throw new Error(`Tree with id ${treeId} not found`);
      }
      return this.toEntity(doc);
    } else {
      // Add new collaborator
      const doc = await this.model
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(treeId) },
          {
            $push: {
              collaborators: {
                userId: new mongoose.Types.ObjectId(collaborator.userId),
                permission: collaborator.permission,
                addedAt: collaborator.addedAt,
              },
            },
          },
          { new: true }
        )
        .lean()
        .exec();

      if (!doc) {
        throw new Error(`Tree with id ${treeId} not found`);
      }
      return this.toEntity(doc);
    }
  }

  async removeCollaborator(treeId: string, userId: string): Promise<ITree> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(treeId) },
        {
          $pull: {
            collaborators: {
              userId: new mongoose.Types.ObjectId(userId),
            },
          },
        },
        { new: true }
      )
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`Tree with id ${treeId} not found`);
    }

    return this.toEntity(doc);
  }

  async updateCollaboratorRole(
    treeId: string,
    userId: string,
    role: string
  ): Promise<ITree> {
    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(treeId),
          'collaborators.userId': new mongoose.Types.ObjectId(userId),
        },
      {
        $set: {
          'collaborators.$.permission': role as ICollaborator['permission'],
        },
      },
      { new: true }
      )
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`User ${userId} is not a collaborator on tree ${treeId}`);
    }

    return this.toEntity(doc);
  }

  async getCollaborators(treeId: string): Promise<ICollaborator[]> {
    const tree = await this.findById(treeId);
    if (!tree) {
      throw new Error(`Tree with id ${treeId} not found`);
    }

    return tree.collaborators;
  }

  async countByOwnerId(ownerId: string): Promise<number> {
    return this.model
      .countDocuments({ ownerId: new mongoose.Types.ObjectId(ownerId) })
      .exec();
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

  async isOwner(treeId: string, userId: string): Promise<boolean> {
    const tree = await this.findById(treeId);
    if (!tree) {
      return false;
    }
    return tree.ownerId === userId;
  }

  async hasAccess(treeId: string, userId: string): Promise<boolean> {
    const tree = await this.findById(treeId);
    if (!tree) {
      return false;
    }

    // Owner always has access
    if (tree.ownerId === userId) {
      return true;
    }

    // Check if user is a collaborator
    return tree.collaborators.some((c) => c.userId === userId);
  }

  /**
   * Converts a MongoDB document to a domain entity (ITree).
   * Handles type conversions including ObjectId to string.
   */
  private toEntity(doc: IFamilyTreeDocument | ReturnType<IFamilyTreeDocument['toObject']>): ITree {
    const docRecord = doc as Record<string, unknown>;
    const settings = docRecord.settings as ITreeSettingsDocument | undefined;
    return {
      _id: this.idToString(docRecord._id)!,
      ownerId: this.idToString(docRecord.ownerId)!,
      name: docRecord.name as string,
      rootPersonId: this.idToString(docRecord.rootPersonId),
      collaborators: this.toCollaboratorsArray(docRecord.collaborators as ICollaboratorDocument[]),
      settings: {
        isPublic: settings?.isPublic ?? false,
        allowComments: settings?.allowComments ?? true,
        defaultPhotoQuality: settings?.defaultPhotoQuality ?? 'medium',
        language: settings?.language ?? 'en',
      },
      createdAt: docRecord.createdAt as Date,
      updatedAt: docRecord.updatedAt as Date,
    };
  }

  /**
   * Converts MongoDB collaborator documents to domain entities.
   */
  private toCollaboratorsArray(
    collaborators: ICollaboratorDocument[]
  ): ICollaborator[] {
    if (!collaborators || collaborators.length === 0) {
      return [];
    }

    return collaborators.map((c) => ({
      userId: c.userId.toString(),
      permission: c.permission as ICollaborator['permission'],
      addedAt: c.addedAt,
    }));
  }
}
