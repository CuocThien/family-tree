import { PersonService } from './PersonService';
import { IPersonService } from './IPersonService';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreatePersonDto, UpdatePersonDto } from '@/types/dtos/person';
import { IPerson } from '@/types/person';
import { ValidationError, PermissionError, NotFoundError } from '@/services/errors/ServiceErrors';

describe('PersonService', () => {
  let service: PersonService;
  let mockPersonRepo: jest.Mocked<IPersonRepository>;
  let mockPermissionService: jest.Mocked<IPermissionService>;
  let mockAuditLogRepo: jest.Mocked<IAuditRepository>;

  const mockPerson: IPerson = {
    _id: 'person-1',
    treeId: 'tree-1',
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'William',
    dateOfBirth: new Date('1990-01-01'),
    dateOfDeath: undefined,
    gender: 'male',
    biography: 'A test person',
    photos: [],
    documents: [],
    customAttributes: new Map(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPersonRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByTreeId: jest.fn(),
      search: jest.fn(),
      countByTreeId: jest.fn(),
      findByIds: jest.fn(),
      exists: jest.fn(),
      existsInTree: jest.fn(),
      deleteByTreeId: jest.fn(),
    } as unknown as jest.Mocked<IPersonRepository>;

    mockPermissionService = {
      canAccess: jest.fn(),
      getPermissions: jest.fn(),
      getRolePermissions: jest.fn(),
      hasMinimumRole: jest.fn(),
    } as unknown as jest.Mocked<IPermissionService>;

    mockAuditLogRepo = {
      create: jest.fn(),
      findByTreeId: jest.fn(),
      findByUserId: jest.fn(),
      findByEntityId: jest.fn(),
      countByTreeId: jest.fn(),
      archiveOlderThan: jest.fn(),
    } as unknown as jest.Mocked<IAuditRepository>;

    service = new PersonService(mockPersonRepo, mockPermissionService, mockAuditLogRepo);
  });

  describe('createPerson', () => {
    const validData: CreatePersonDto = {
      treeId: 'tree-1',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'William',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      biography: 'A test person',
    };

    it('should create person when valid data provided and permission granted', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.create.mockResolvedValue(mockPerson);
      mockAuditLogRepo.create.mockResolvedValue({} as any);

      const result = await service.createPerson('tree-1', 'user-1', validData);

      expect(result).toEqual(mockPerson);
      expect(mockPersonRepo.create).toHaveBeenCalled();
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith({
        treeId: 'tree-1',
        userId: 'user-1',
        action: 'create',
        entityType: 'Person',
        entityId: 'person-1',
        changes: [],
      });
    });

    it('should throw PermissionError when permission denied', async () => {
      mockPermissionService.canAccess.mockResolvedValue(false);

      await expect(service.createPerson('tree-1', 'user-1', validData)).rejects.toThrow(PermissionError);
    });

    it('should throw ValidationError when death date before birth date', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);

      const invalidData: CreatePersonDto = {
        ...validData,
        dateOfBirth: new Date('2000-01-01'),
        dateOfDeath: new Date('1990-01-01'),
      };

      await expect(service.createPerson('tree-1', 'user-1', invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when birth date is in future', async () => {
      mockPermissionService.canAccess.mockResolvedValue(true);

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidData: CreatePersonDto = {
        ...validData,
        dateOfBirth: futureDate,
      };

      await expect(service.createPerson('tree-1', 'user-1', invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('updatePerson', () => {
    it('should update person when valid data provided and permission granted', async () => {
      const updatedPerson = { ...mockPerson, firstName: 'Jane' };
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.update.mockResolvedValue(updatedPerson);
      mockAuditLogRepo.create.mockResolvedValue({} as any);

      const updateData: UpdatePersonDto = {
        firstName: 'Jane',
      };

      const result = await service.updatePerson('person-1', 'user-1', updateData);

      expect(result.firstName).toBe('Jane');
      expect(mockPersonRepo.update).toHaveBeenCalledWith('person-1', expect.any(Object));
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.updatePerson('nonexistent', 'user-1', { firstName: 'Jane' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('deletePerson', () => {
    it('should delete person when permission granted', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);
      mockPersonRepo.delete.mockResolvedValue(undefined);
      mockAuditLogRepo.create.mockResolvedValue({} as any);

      await service.deletePerson('person-1', 'user-1');

      expect(mockPersonRepo.delete).toHaveBeenCalledWith('person-1');
      expect(mockAuditLogRepo.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      await expect(service.deletePerson('nonexistent', 'user-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPersonById', () => {
    it('should return person when found and permission granted', async () => {
      mockPersonRepo.findById.mockResolvedValue(mockPerson);
      mockPermissionService.canAccess.mockResolvedValue(true);

      const result = await service.getPersonById('person-1', 'user-1');

      expect(result).toEqual(mockPerson);
    });

    it('should return null when person not found', async () => {
      mockPersonRepo.findById.mockResolvedValue(null);

      const result = await service.getPersonById('nonexistent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('getFullName', () => {
    it('should return full name with middle name', () => {
      const result = service.getFullName(mockPerson);
      expect(result).toBe('John William Doe');
    });

    it('should return full name without middle name', () => {
      const personWithoutMiddle = { ...mockPerson, middleName: undefined };
      const result = service.getFullName(personWithoutMiddle);
      expect(result).toBe('John Doe');
    });
  });

  describe('getAge', () => {
    it('should calculate age for living person', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 30);

      const person = { ...mockPerson, dateOfBirth: birthDate };
      const result = service.getAge(person);

      expect(result).toBe(30);
    });

    it('should calculate age for deceased person', () => {
      const birthDate = new Date('1990-01-01');
      const deathDate = new Date('2020-01-01');

      const person = { ...mockPerson, dateOfBirth: birthDate, dateOfDeath: deathDate };
      const result = service.getAge(person);

      expect(result).toBe(30);
    });

    it('should return null when no birth date', () => {
      const person = { ...mockPerson, dateOfBirth: undefined };
      const result = service.getAge(person);

      expect(result).toBeNull();
    });
  });

  describe('getLifespan', () => {
    it('should return lifespan for deceased person', () => {
      const person = {
        ...mockPerson,
        dateOfBirth: new Date('1990-01-01'),
        dateOfDeath: new Date('2020-01-01'),
      };
      const result = service.getLifespan(person);

      expect(result).toBe('1990 - 2020');
    });

    it('should return lifespan for living person', () => {
      const person = {
        ...mockPerson,
        dateOfBirth: new Date('1990-01-01'),
        dateOfDeath: undefined,
      };
      const result = service.getLifespan(person);

      expect(result).toContain('1990 -');
    });

    it('should return unknown when no birth date', () => {
      const person = { ...mockPerson, dateOfBirth: undefined };
      const result = service.getLifespan(person);

      expect(result).toBe('Unknown');
    });
  });
});
