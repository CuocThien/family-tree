import { Model } from 'mongoose';
import { RelationshipModel, IRelationshipDocument } from '@/models/Relationship';
import {
  IRelationshipRepository,
} from '@/repositories/interfaces/IRelationshipRepository';
import { IRelationship, CreateRelationshipData, UpdateRelationshipData, RelationshipType } from '@/types/relationship';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

/**
 * MongoDB implementation of IRelationshipRepository.
 * Handles CRUD operations for Relationship entities.
 */
export class RelationshipRepository extends BaseRepository implements IRelationshipRepository {
  constructor(private model: Model<IRelationshipDocument> = RelationshipModel) {
    super();
  }

  async findById(id: string): Promise<IRelationship | null> {
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

  async findByTreeId(treeId: string): Promise<IRelationship[]> {
    const docs = await this.model
      .find({ treeId: new mongoose.Types.ObjectId(treeId) })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async create(data: CreateRelationshipData): Promise<IRelationship> {
    const createData = {
      ...data,
      treeId: new mongoose.Types.ObjectId(data.treeId),
      person1Id: new mongoose.Types.ObjectId(data.person1Id),
      person2Id: new mongoose.Types.ObjectId(data.person2Id),
    };

    const doc = await this.model.create(createData);
    const plainDoc = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return this.toEntity(plainDoc);
  }

  async update(id: string, data: UpdateRelationshipData): Promise<IRelationship> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!doc) {
      throw new Error(`Relationship with id ${id} not found`);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }

  async findByPersonId(personId: string): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    const docs = await this.model
      .find({
        $or: [{ person1Id: oid }, { person2Id: oid }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findByPersonIdAndType(personId: string, type: RelationshipType): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    const docs = await this.model
      .find({
        type,
        $or: [{ person1Id: oid }, { person2Id: oid }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findBetweenPersons(personId1: string, personId2: string): Promise<IRelationship | null> {
    const oid1 = new mongoose.Types.ObjectId(personId1);
    const oid2 = new mongoose.Types.ObjectId(personId2);

    const doc = await this.model
      .findOne({
        $or: [
          { person1Id: oid1, person2Id: oid2 },
          { person1Id: oid2, person2Id: oid1 },
        ],
      })
      .lean()
      .exec();

    return doc ? this.toEntity(doc) : null;
  }

  async findParents(personId: string): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    // Find relationships where personId is person2Id and type is 'parent'
    const docs = await this.model
      .find({
        person2Id: oid,
        type: 'parent',
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findChildren(personId: string): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    // Find relationships where personId is person1Id and type is 'child'
    const docs = await this.model
      .find({
        person1Id: oid,
        type: 'child',
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findSpouses(personId: string): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    const docs = await this.model
      .find({
        type: 'spouse',
        $or: [{ person1Id: oid }, { person2Id: oid }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async findSiblings(personId: string): Promise<IRelationship[]> {
    const oid = new mongoose.Types.ObjectId(personId);

    const docs = await this.model
      .find({
        type: 'sibling',
        $or: [{ person1Id: oid }, { person2Id: oid }],
      })
      .lean()
      .exec();

    return docs.map((doc) => this.toEntity(doc));
  }

  async exists(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean> {
    const oid1 = new mongoose.Types.ObjectId(fromPersonId);
    const oid2 = new mongoose.Types.ObjectId(toPersonId);

    const count = await this.model
      .countDocuments({
        type,
        $or: [
          { person1Id: oid1, person2Id: oid2 },
          { person1Id: oid2, person2Id: oid1 },
        ],
      })
      .exec();

    return count > 0;
  }

  async deleteByPersonId(personId: string): Promise<number> {
    const oid = new mongoose.Types.ObjectId(personId);

    const result = await this.model
      .deleteMany({
        $or: [{ person1Id: oid }, { person2Id: oid }],
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

  private toEntity(doc: any): IRelationship {
    return {
      _id: this.idToString(doc._id)!,
      treeId: this.idToString(doc.treeId)!,
      person1Id: this.idToString(doc.person1Id)!,
      person2Id: this.idToString(doc.person2Id)!,
      type: doc.type as RelationshipType,
      startDate: this.toDate(doc.startDate),
      endDate: this.toDate(doc.endDate),
      notes: doc.notes as string | undefined,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }
}
