import { IPersonService, PersonSearchParams, PersonListResult } from './IPersonService';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { IRelationshipService } from '@/services/relationship/IRelationshipService';
import { CreatePersonDto, UpdatePersonDto, CreatePersonDtoSchema, UpdatePersonDtoSchema } from '@/types/dtos/person';
import { IPerson, UpdatePersonData } from '@/types/person';
import { ValidationError, PermissionError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';
import { sanitizePersonData as sanitizeDataUtil, sanitizeHTML } from '@/lib/utils/sanitization';

export class PersonService implements IPersonService {
  private relationshipService: IRelationshipService | null = null;

  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditRepository
  ) {}

  /**
   * Set the relationship service (for late binding to avoid circular dependency)
   */
  setRelationshipService(service: IRelationshipService): void {
    this.relationshipService = service;
  }

  async createPerson(treeId: string, userId: string, data: CreatePersonDto): Promise<IPerson> {
    // 1. Check permission
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_PERSON);
    if (!canAdd) {
      throw new PermissionError('Permission denied: Cannot add person to this tree');
    }

    // 2. Validate input
    const errors = await this.validatePersonData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // 3. Sanitize inputs
    const sanitizedData = this.sanitizePersonData(data);

    // 4. Create person
    const person = await this.personRepository.create({
      treeId,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      middleName: sanitizedData.middleName,
      dateOfBirth: sanitizedData.dateOfBirth,
      dateOfDeath: sanitizedData.dateOfDeath,
      gender: sanitizedData.gender,
      biography: sanitizedData.biography,
      photos: sanitizedData.photos || [],
      documents: sanitizedData.documents || [],
      customAttributes: sanitizedData.customAttributes
        ? new Map(Object.entries(sanitizedData.customAttributes))
        : undefined,
    });

    // 5. Audit log
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'create',
      entityType: 'Person',
      entityId: person._id,
      changes: [],
    });

    return person;
  }

  async updatePerson(personId: string, userId: string, data: UpdatePersonDto): Promise<IPerson> {
    // 1. Get existing person
    const existingPerson = await this.personRepository.findById(personId);
    if (!existingPerson) {
      throw new NotFoundError('Person', personId);
    }

    // 2. Check permission
    const canEdit = await this.permissionService.canAccess(userId, existingPerson.treeId, Permission.EDIT_PERSON);
    if (!canEdit) {
      throw new PermissionError('Permission denied: Cannot edit this person');
    }

    // 3. Validate input
    const errors = await this.validatePersonData(data);
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    // 4. Track gender change for relationship updates
    const genderChanged = data.gender !== undefined && data.gender !== existingPerson.gender;

    // 5. Sanitize inputs
    const sanitizedData = this.sanitizeUpdateData(data);

    // 6. Update person
    const updatedPerson = await this.personRepository.update(personId, sanitizedData);

    // 7. Update parent relationships if gender changed
    if (genderChanged && data.gender && this.relationshipService) {
      try {
        await this.relationshipService.updateParentRelationshipsOnGenderChange(
          personId,
          data.gender,
          userId
        );
      } catch (error) {
        // Log the error but don't fail the person update
        console.error('Failed to update parent relationships on gender change:', error);
      }
    }

    // 8. Audit log
    await this.auditLogRepository.create({
      treeId: existingPerson.treeId,
      userId,
      action: 'update',
      entityType: 'Person',
      entityId: personId,
      changes: [],
    });

    return updatedPerson;
  }

  async deletePerson(personId: string, userId: string): Promise<void> {
    // 1. Get existing person
    const existingPerson = await this.personRepository.findById(personId);
    if (!existingPerson) {
      throw new NotFoundError('Person', personId);
    }

    // 2. Check permission
    const canDelete = await this.permissionService.canAccess(userId, existingPerson.treeId, Permission.DELETE_PERSON);
    if (!canDelete) {
      throw new PermissionError('Permission denied: Cannot delete this person');
    }

    // 3. Delete person
    await this.personRepository.delete(personId);

    // 4. Audit log
    await this.auditLogRepository.create({
      treeId: existingPerson.treeId,
      userId,
      action: 'delete',
      entityType: 'Person',
      entityId: personId,
      changes: [],
    });
  }

  async getPersonById(personId: string, userId: string): Promise<IPerson | null> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      return null;
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, person.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied: Cannot view this person');
    }

    return person;
  }

  async getPersonsByTreeId(treeId: string, userId: string, params?: PersonSearchParams): Promise<PersonListResult> {
    // Check permission
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied: Cannot view persons in this tree');
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    // Build search criteria
    const criteria: {
      firstName?: string;
      lastName?: string;
      birthYear?: number;
      isLiving?: boolean;
    } = {};

    if (params?.firstName) {
      criteria.firstName = params.firstName;
    }
    if (params?.lastName) {
      criteria.lastName = params.lastName;
    }
    if (params?.birthYear) {
      criteria.birthYear = params.birthYear;
    }
    if (params?.isLiving !== undefined) {
      criteria.isLiving = params.isLiving;
    }

    // Get persons
    const persons = await this.personRepository.search(treeId, criteria);
    const total = await this.personRepository.countByTreeId(treeId);

    // Apply pagination
    const paginatedPersons = persons.slice(offset, offset + limit);

    return {
      persons: paginatedPersons,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async validatePersonData(data: CreatePersonDto | UpdatePersonDto): Promise<string[]> {
    const errors: string[] = [];

    // Validate with Zod schema
    // Check if it's CreatePersonDto by presence of treeId
    const isCreateDto = 'treeId' in data && typeof data.treeId === 'string';
    const schema = isCreateDto ? CreatePersonDtoSchema : UpdatePersonDtoSchema;

    const result = schema.safeParse(data);
    if (!result.success) {
      errors.push(...result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
    }

    // Additional business rules
    if (data.dateOfBirth && data.dateOfDeath) {
      if (new Date(data.dateOfDeath) < new Date(data.dateOfBirth)) {
        errors.push('Death date cannot be before birth date');
      }
    }

    if (data.dateOfBirth && new Date(data.dateOfBirth) > new Date()) {
      errors.push('Birth date cannot be in the future');
    }

    // Check living status consistency
    if (data.dateOfDeath) {
      // If death date is set, person is not living
      // This is handled at the domain/model level
    }

    return errors;
  }

  getFullName(person: IPerson): string {
    const parts = [person.firstName, person.middleName, person.lastName].filter(Boolean);
    return parts.join(' ');
  }

  getAge(person: IPerson): number | null {
    if (!person.dateOfBirth) {
      return null;
    }

    const birthDate = new Date(person.dateOfBirth);
    const endDate = person.dateOfDeath ? new Date(person.dateOfDeath) : new Date();

    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getLifespan(person: IPerson): string {
    if (!person.dateOfBirth) {
      return 'Unknown';
    }

    const birthYear = new Date(person.dateOfBirth).getFullYear();
    const deathYear = person.dateOfDeath ? new Date(person.dateOfDeath).getFullYear() : 'present';

    return `${birthYear} - ${deathYear}`;
  }

  private sanitizePersonData(data: CreatePersonDto): CreatePersonDto {
    const sanitized = sanitizeDataUtil(data);
    // Sanitize HTML in biography to prevent XSS attacks
    if (sanitized.biography) {
      (sanitized as any).biography = sanitizeHTML(sanitized.biography as string);
    }
    return sanitized;
  }

  private sanitizeUpdateData(data: UpdatePersonDto): UpdatePersonData {
    const sanitized: UpdatePersonData = {};

    if (data.firstName !== undefined) {
      sanitized.firstName = data.firstName.trim();
    }
    if (data.lastName !== undefined) {
      sanitized.lastName = data.lastName.trim();
    }
    if (data.middleName !== undefined) {
      sanitized.middleName = data.middleName?.trim();
    }
    if (data.biography !== undefined) {
      // Sanitize HTML in biography to prevent XSS attacks
      sanitized.biography = sanitizeHTML(data.biography);
    }

    // Copy other fields as-is
    if (data.dateOfBirth !== undefined) {
      sanitized.dateOfBirth = data.dateOfBirth;
    }
    if (data.dateOfDeath !== undefined) {
      sanitized.dateOfDeath = data.dateOfDeath;
    }
    if (data.gender !== undefined) {
      sanitized.gender = data.gender;
    }
    if (data.photos !== undefined) {
      sanitized.photos = data.photos;
    }
    if (data.documents !== undefined) {
      sanitized.documents = data.documents;
    }
    if (data.customAttributes !== undefined) {
      sanitized.customAttributes = new Map(Object.entries(data.customAttributes));
    }

    return sanitized;
  }
}
