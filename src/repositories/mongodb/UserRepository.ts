import { Model } from 'mongoose';
import { UserModel, IUserDocument, IUserProfileDocument } from '@/models/User';
import {
  IUserRepository,
} from '@/repositories/interfaces/IUserRepository';
import { IUser, CreateUserData, UpdateUserData } from '@/types/user';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of IUserRepository.
 * Handles CRUD operations for User entities with special password handling.
 */
export class UserRepository extends BaseRepository implements IUserRepository {
  constructor(private model: Model<IUserDocument> = UserModel) {
    super();
  }

  async findById(id: string): Promise<IUser | null> {
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

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase() }).lean().exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    // Use select('+password') to include the password field
    const doc = await this.model
      .findOne({ email: email.toLowerCase() })
      .select('+password')
      .lean()
      .exec();

    if (!doc) {
      return null;
    }

    // For authentication purposes, we return the document with password
    // Note: This is the only method that exposes password
    return {
      _id: doc._id.toString(),
      email: doc.email,
      profile: {
        name: (doc.profile as any).name,
        avatar: (doc.profile as any).avatar,
      },
      trees: (doc.trees as mongoose.Types.ObjectId[]).map((id) => id.toString()),
      role: doc.role,
      isVerified: doc.isVerified,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(data: CreateUserData): Promise<IUser> {
    const createData = {
      email: data.email.toLowerCase(),
      password: data.password,
      profile: data.profile,
      role: data.role || 'user',
      trees: [],
      isVerified: false,
    };

    const doc = await this.model.create(createData);
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async update(id: string, data: UpdateUserData): Promise<IUser> {
    const updateData: Record<string, unknown> = {};

    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase();
    }
    if (data.profile) {
      if (data.profile.name !== undefined) {
        updateData['profile.name'] = data.profile.name;
      }
      if (data.profile.avatar !== undefined) {
        updateData['profile.avatar'] = data.profile.avatar;
      }
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, { $set: { password: hashedPassword } })
      .exec();
  }

  async verifyEmail(id: string): Promise<IUser> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: { isVerified: true } }, { new: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async addTree(userId: string, treeId: string): Promise<void> {
    await this.model
      .updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $addToSet: { trees: new mongoose.Types.ObjectId(treeId) } }
      )
      .exec();
  }

  async removeTree(userId: string, treeId: string): Promise<void> {
    await this.model
      .updateOne(
        { _id: new mongoose.Types.ObjectId(userId) },
        { $pull: { trees: new mongoose.Types.ObjectId(treeId) } }
      )
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

  async emailExists(email: string): Promise<boolean> {
    const count = await this.model
      .countDocuments({ email: email.toLowerCase() })
      .exec();
    return count > 0;
  }

  private toEntity(doc: IUserDocument | ReturnType<IUserDocument['toObject']>): IUser {
    const docRecord = doc as Record<string, unknown>;
    const profile = docRecord.profile as IUserProfileDocument | undefined;
    const trees = (docRecord.trees as mongoose.Types.ObjectId[]) ?? [];

    return {
      _id: this.idToString(docRecord._id)!,
      email: docRecord.email as string,
      profile: {
        name: profile?.name ?? '',
        avatar: profile?.avatar,
      },
      trees: trees.map((id) => id.toString()),
      role: docRecord.role as IUser['role'],
      isVerified: docRecord.isVerified as boolean,
      createdAt: docRecord.createdAt as Date,
      updatedAt: docRecord.updatedAt as Date,
    };
  }
}
