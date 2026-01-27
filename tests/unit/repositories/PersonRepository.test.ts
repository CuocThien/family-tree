import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PersonRepository } from '@/repositories/mongodb/PersonRepository';
import { PersonModel, IPersonDocument } from '@/models/Person';
import { IPerson, CreatePersonData, UpdatePersonData } from '@/types/person';
import { PersonQueryOptions, PersonSearchCriteria } from '@/repositories/interfaces/IPersonRepository';
import mongoose from 'mongoose';

// Mock the PersonModel
jest.mock('@/models/Person', () => {
  const actual = jest.requireActual('@/models/Person');
  return {
    ...actual,
    PersonModel: {
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      lean: jest.fn(),
    },
  };
});

const mockPersonModel = PersonModel as unknown as {
  findById: jest.MockedFunction<any>;
  find: jest.MockedFunction<any>;
  create: jest.MockedFunction<any>;
  findByIdAndUpdate: jest.MockedFunction<any>;
  findByIdAndDelete: jest.MockedFunction<any>;
  countDocuments: jest.MockedFunction<any>;
};

describe('PersonRepository', () => {
  let repository: PersonRepository;

  // Helper to create a mock person document
  const createMockPersonDoc = (overrides: Partial<IPersonDocument> = {}): IPersonDocument => {
    const _id = new mongoose.Types.ObjectId();
    return {
      _id,
      treeId: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      middleName: undefined,
      dateOfBirth: undefined,
      dateOfDeath: undefined,
      gender: undefined,
      biography: undefined,
      photos: [],
      documents: [],
      customAttributes: new Map(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as IPersonDocument;
  };

  beforeEach(() => {
    repository = new PersonRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return person when found', async () => {
      const mockPerson = createMockPersonDoc({
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPerson),
      });

      mockPersonModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById(mockPerson._id.toString());

      expect(result).not.toBeNull();
      expect(result?._id).toBe(mockPerson._id.toString());
      expect(result?.firstName).toBe('Jane');
      expect(result?.lastName).toBe('Smith');
    });

    it('should return null when person not found', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockPersonModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });

    it('should return null for invalid ObjectId format', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockRejectedValue(
          Object.assign(new Error('Cast to ObjectId failed'), { name: 'CastError' })
        ),
      });

      mockPersonModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById('invalid-id-format');

      expect(result).toBeNull();
    });

    it('should convert ObjectId to string in returned entity', async () => {
      const mockPerson = createMockPersonDoc();

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPerson),
      });

      mockPersonModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById(mockPerson._id.toString());

      expect(result).not.toBeNull();
      expect(typeof result?._id).toBe('string');
      expect(typeof result?.treeId).toBe('string');
    });

    it('should handle Map customAttributes correctly', async () => {
      const customAttrs = new Map<string, string | number | boolean>([
        ['education', 'Harvard'],
        ['occupation', 'Engineer'],
      ]);
      const mockPerson = createMockPersonDoc({ customAttributes: customAttrs });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPerson),
      });

      mockPersonModel.findById.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.findById(mockPerson._id.toString());

      expect(result).not.toBeNull();
      expect(result?.customAttributes).toEqual(customAttrs);
    });
  });

  describe('findByTreeId', () => {
    it('should return persons for a tree with default options', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const mockPersons = [
        createMockPersonDoc({ treeId, firstName: 'Alice', lastName: 'Johnson' }),
        createMockPersonDoc({ treeId, firstName: 'Bob', lastName: 'Johnson' }),
      ];

      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPersons),
        }),
      };

      mockPersonModel.find.mockReturnValue(queryMock as any);

      const results = await repository.findByTreeId(treeId.toString());

      expect(mockPersonModel.find).toHaveBeenCalledWith({ treeId });
      expect(queryMock.sort).toHaveBeenCalledWith({ lastName: 1 });
      expect(queryMock.skip).toHaveBeenCalledWith(0);
      expect(queryMock.limit).toHaveBeenCalledWith(100);
      expect(results).toHaveLength(2);
      expect(results[0].firstName).toBe('Alice');
    });

    it('should apply custom query options', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const mockPersons = [createMockPersonDoc({ treeId })];

      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPersons),
        }),
      };

      mockPersonModel.find.mockReturnValue(queryMock as any);

      const options: PersonQueryOptions = {
        limit: 50,
        offset: 10,
        sortBy: 'firstName',
        sortOrder: 'desc',
      };

      await repository.findByTreeId(treeId.toString(), options);

      expect(queryMock.sort).toHaveBeenCalledWith({ firstName: -1 });
      expect(queryMock.skip).toHaveBeenCalledWith(10);
      expect(queryMock.limit).toHaveBeenCalledWith(50);
    });

    it('should return empty array when no persons found', async () => {
      const treeId = new mongoose.Types.ObjectId();

      const queryMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      };

      mockPersonModel.find.mockReturnValue(queryMock as any);

      const results = await repository.findByTreeId(treeId.toString());

      expect(results).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create and return a new person', async () => {
      const createData: CreatePersonData = {
        treeId: new mongoose.Types.ObjectId().toString(),
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
      };

      const mockPerson = createMockPersonDoc({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
      });

      mockPersonModel.create.mockResolvedValue(mockPerson as any);

      const result = await repository.create(createData);

      expect(mockPersonModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          treeId: expect.any(mongoose.Types.ObjectId),
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
        })
      );
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result._id).toBe(mockPerson._id.toString());
    });

    it('should convert Map customAttributes to plain object for storage', async () => {
      const customAttrs = new Map<string, string | number | boolean>([
        ['key1', 'value1'],
        ['key2', 42],
      ]);
      const createData: CreatePersonData = {
        treeId: new mongoose.Types.ObjectId().toString(),
        firstName: 'Jane',
        lastName: 'Smith',
        customAttributes: customAttrs,
      };

      const mockPerson = createMockPersonDoc();

      mockPersonModel.create.mockResolvedValue(mockPerson as any);

      await repository.create(createData);

      expect(mockPersonModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customAttributes: expect.any(Object),
        })
      );
    });
  });

  describe('update', () => {
    it('should update and return the person', async () => {
      const personId = new mongoose.Types.ObjectId();
      const updateData: UpdatePersonData = {
        firstName: 'Jane',
        gender: 'female',
      };

      const updatedDoc = createMockPersonDoc({
        _id: personId,
        firstName: 'Jane',
        gender: 'female',
      });

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedDoc),
      });

      mockPersonModel.findByIdAndUpdate.mockReturnValue({ lean: leanMock } as any);

      const result = await repository.update(personId.toString(), updateData);

      expect(mockPersonModel.findByIdAndUpdate).toHaveBeenCalledWith(
        personId.toString(),
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(result?.firstName).toBe('Jane');
    });

    it('should throw error when person not found for update', async () => {
      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockPersonModel.findByIdAndUpdate.mockReturnValue({ lean: leanMock } as any);

      await expect(
        repository.update('507f1f77bcf86cd799439011', { firstName: 'Jane' })
      ).rejects.toThrow('Person with id 507f1f77bcf86cd799439011 not found');
    });
  });

  describe('delete', () => {
    it('should delete the person', async () => {
      const personId = new mongoose.Types.ObjectId();

      const execMock = jest.fn().mockResolvedValue({ _id: personId });
      mockPersonModel.findByIdAndDelete.mockReturnValue({ exec: execMock } as any);

      await repository.delete(personId.toString());

      expect(mockPersonModel.findByIdAndDelete).toHaveBeenCalledWith(personId.toString());
      expect(execMock).toHaveBeenCalled();
    });

    it('should be idempotent - deleting non-existent person should not throw', async () => {
      const execMock = jest.fn().mockResolvedValue(null);
      mockPersonModel.findByIdAndDelete.mockReturnValue({ exec: execMock } as any);

      await expect(
        repository.delete('507f1f77bcf86cd799439011')
      ).resolves.not.toThrow();
    });
  });

  describe('search', () => {
    it('should search by firstName with case-insensitive regex', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const criteria: PersonSearchCriteria = { firstName: 'john' };
      const mockPersons = [createMockPersonDoc({ treeId, firstName: 'John' })];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      await repository.search(treeId.toString(), criteria);

      expect(mockPersonModel.find).toHaveBeenCalledWith({
        treeId: expect.any(mongoose.Types.ObjectId),
        firstName: { $regex: 'john', $options: 'i' },
      });
    });

    it('should search by lastName with case-insensitive regex', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const criteria: PersonSearchCriteria = { lastName: 'smith' };
      const mockPersons = [createMockPersonDoc({ treeId, lastName: 'Smith' })];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      await repository.search(treeId.toString(), criteria);

      expect(mockPersonModel.find).toHaveBeenCalledWith({
        treeId: expect.any(mongoose.Types.ObjectId),
        lastName: { $regex: 'smith', $options: 'i' },
      });
    });

    it('should search by birthYear using date range', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const criteria: PersonSearchCriteria = { birthYear: 1990 };
      const mockPersons = [createMockPersonDoc({ treeId })];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      await repository.search(treeId.toString(), criteria);

      const findCall = mockPersonModel.find.mock.calls[0][0];
      expect(findCall).toHaveProperty('treeId');
      expect(findCall).toHaveProperty('dateOfBirth');
      expect(findCall.dateOfBirth).toHaveProperty('$gte');
      expect(findCall.dateOfBirth).toHaveProperty('$lt');
    });

    it('should search by isLiving status', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const criteria: PersonSearchCriteria = { isLiving: true };
      const mockPersons = [createMockPersonDoc({ treeId })];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      await repository.search(treeId.toString(), criteria);

      expect(mockPersonModel.find).toHaveBeenCalledWith({
        treeId: expect.any(mongoose.Types.ObjectId),
        dateOfDeath: { $exists: false },
      });
    });

    it('should combine multiple search criteria', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const criteria: PersonSearchCriteria = {
        firstName: 'john',
        lastName: 'doe',
        isLiving: true,
      };
      const mockPersons = [createMockPersonDoc({ treeId })];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      await repository.search(treeId.toString(), criteria);

      const findCall = mockPersonModel.find.mock.calls[0][0];
      expect(findCall).toHaveProperty('treeId');
      expect(findCall).toHaveProperty('firstName');
      expect(findCall).toHaveProperty('lastName');
      expect(findCall).toHaveProperty('dateOfDeath');
    });
  });

  describe('countByTreeId', () => {
    it('should return count of persons in tree', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(42);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const count = await repository.countByTreeId(treeId.toString());

      expect(mockPersonModel.countDocuments).toHaveBeenCalledWith({
        treeId: expect.any(mongoose.Types.ObjectId),
      });
      expect(count).toBe(42);
    });

    it('should return 0 for empty tree', async () => {
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(0);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const count = await repository.countByTreeId(treeId.toString());

      expect(count).toBe(0);
    });
  });

  describe('findByIds', () => {
    it('should return empty array for empty input', async () => {
      const results = await repository.findByIds([]);

      expect(results).toEqual([]);
      expect(mockPersonModel.find).not.toHaveBeenCalled();
    });

    it('should return persons by array of ids', async () => {
      const ids = [
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
      ];
      const mockPersons = [
        createMockPersonDoc({ _id: new mongoose.Types.ObjectId(ids[0]) }),
        createMockPersonDoc({ _id: new mongoose.Types.ObjectId(ids[1]) }),
      ];

      const leanMock = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPersons),
      });

      mockPersonModel.find.mockReturnValue({ lean: leanMock } as any);

      const results = await repository.findByIds(ids);

      expect(mockPersonModel.find).toHaveBeenCalledWith({
        _id: { $in: expect.any(Array) },
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('exists', () => {
    it('should return true when person exists', async () => {
      const personId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(1);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.exists(personId.toString());

      expect(exists).toBe(true);
    });

    it('should return false when person does not exist', async () => {
      const personId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(0);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.exists(personId.toString());

      expect(exists).toBe(false);
    });

    it('should return false for invalid ObjectId', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('Invalid ObjectId'));
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.exists('invalid-id');

      expect(exists).toBe(false);
    });
  });

  describe('existsInTree', () => {
    it('should return true when person exists in tree', async () => {
      const personId = new mongoose.Types.ObjectId();
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(1);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.existsInTree(personId.toString(), treeId.toString());

      expect(exists).toBe(true);
      expect(mockPersonModel.countDocuments).toHaveBeenCalledWith({
        _id: personId,
        treeId,
      });
    });

    it('should return false when person does not exist in tree', async () => {
      const personId = new mongoose.Types.ObjectId();
      const treeId = new mongoose.Types.ObjectId();
      const execMock = jest.fn().mockResolvedValue(0);
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.existsInTree(personId.toString(), treeId.toString());

      expect(exists).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const execMock = jest.fn().mockRejectedValue(new Error('Database error'));
      mockPersonModel.countDocuments.mockReturnValue({ exec: execMock } as any);

      const exists = await repository.existsInTree('invalid-id', 'invalid-tree');

      expect(exists).toBe(false);
    });
  });
});
