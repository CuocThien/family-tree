import { IRelationshipService, FamilyMembers, AncestryPath } from './IRelationshipService';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateRelationshipDto, UpdateRelationshipDto } from '@/types/dtos/relationship';
import { IRelationship, RelationshipType } from '@/types/relationship';
import { IPerson } from '@/types/person';
import { ValidationError, PermissionError, NotFoundError, BusinessRuleError } from '@/services/errors/ServiceErrors';

export class RelationshipService implements IRelationshipService {
  constructor(
    private readonly relationshipRepository: IRelationshipRepository,
    private readonly personRepository: IPersonRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditRepository
  ) {}

  async createRelationship(treeId: string, userId: string, data: CreateRelationshipDto): Promise<IRelationship> {
    // 1. Permission check
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_RELATIONSHIP);
    if (!canAdd) {
      throw new PermissionError('Permission denied');
    }

    // 2. Validate persons exist and belong to same tree
    const [fromPerson, toPerson] = await Promise.all([
      this.personRepository.findById(data.fromPersonId),
      this.personRepository.findById(data.toPersonId),
    ]);

    if (!fromPerson || !toPerson) {
      throw new NotFoundError('Person', data.fromPersonId || data.toPersonId);
    }

    if (fromPerson.treeId !== treeId || toPerson.treeId !== treeId) {
      throw new BusinessRuleError('Persons must belong to the same tree');
    }

    // 3. Validate relationship rules
    const validationErrors = await this.validateRelationship(data);
    if (validationErrors.length > 0) {
      throw new ValidationError(validationErrors);
    }

    // 4. Check for cycles
    const hasCycle = await this.checkForCycles(data.fromPersonId, data.toPersonId, data.type);
    if (hasCycle) {
      throw new BusinessRuleError('This relationship would create an impossible cycle');
    }

    // 5. Check for duplicate relationships
    const existingRelationship = await this.relationshipRepository.findBetweenPersons(
      data.fromPersonId,
      data.toPersonId
    );
    if (existingRelationship) {
      throw new BusinessRuleError('A relationship between these persons already exists');
    }

    // 6. Create relationship
    const relationship = await this.relationshipRepository.create({
      treeId,
      fromPersonId: data.fromPersonId,
      toPersonId: data.toPersonId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes?.trim(),
    });

    // 7. Audit log
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'create',
      entityType: 'Relationship',
      entityId: relationship._id,
      changes: [],
    });

    return relationship;
  }

  async updateRelationship(relationshipId: string, userId: string, data: UpdateRelationshipDto): Promise<IRelationship> {
    // 1. Get existing relationship
    const existing = await this.relationshipRepository.findById(relationshipId);
    if (!existing) {
      throw new NotFoundError('Relationship', relationshipId);
    }

    // 2. Check permission
    const canEdit = await this.permissionService.canAccess(userId, existing.treeId, Permission.ADD_RELATIONSHIP);
    if (!canEdit) {
      throw new PermissionError('Permission denied');
    }

    // 3. Update relationship
    const updated = await this.relationshipRepository.update(relationshipId, data);

    // 4. Audit log
    await this.auditLogRepository.create({
      treeId: existing.treeId,
      userId,
      action: 'update',
      entityType: 'Relationship',
      entityId: relationshipId,
      changes: [],
    });

    return updated;
  }

  async deleteRelationship(relationshipId: string, userId: string): Promise<void> {
    // 1. Get existing relationship
    const existing = await this.relationshipRepository.findById(relationshipId);
    if (!existing) {
      throw new NotFoundError('Relationship', relationshipId);
    }

    // 2. Check permission
    const canDelete = await this.permissionService.canAccess(userId, existing.treeId, Permission.ADD_RELATIONSHIP);
    if (!canDelete) {
      throw new PermissionError('Permission denied');
    }

    // 3. Delete relationship
    await this.relationshipRepository.delete(relationshipId);

    // 4. Audit log
    await this.auditLogRepository.create({
      treeId: existing.treeId,
      userId,
      action: 'delete',
      entityType: 'Relationship',
      entityId: relationshipId,
      changes: [],
    });
  }

  async getFamilyMembers(personId: string, userId: string): Promise<FamilyMembers> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundError('Person', personId);
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, person.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const [parents, children, spouses, siblingRelationships] = await Promise.all([
      this.relationshipRepository.findParents(personId),
      this.relationshipRepository.findChildren(personId),
      this.relationshipRepository.findSpouses(personId),
      this.relationshipRepository.findSiblings(personId),
    ]);

    const parentIds = parents.map((r) => r.fromPersonId);
    const childIds = children.map((r) => r.toPersonId);
    const spouseIds = spouses.map((r) => r.toPersonId);
    const siblingIds = siblingRelationships.map((r) => r.toPersonId);

    const [parentPersons, childPersons, spousePersons, siblingPersons] = await Promise.all([
      this.getPersonsByIds(parentIds),
      this.getPersonsByIds(childIds),
      this.getPersonsByIds(spouseIds),
      this.getPersonsByIds(siblingIds),
    ]);

    return {
      parents: parentPersons,
      children: childPersons,
      spouses: spousePersons,
      siblings: siblingPersons,
    };
  }

  async getAncestors(personId: string, userId: string, generations: number = 10): Promise<AncestryPath> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundError('Person', personId);
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, person.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const result: IPerson[][] = [];
    const visited = new Set<string>();

    // Start with current person
    result.push([person]);
    visited.add(personId);

    // Build ancestor tree
    for (let gen = 0; gen < generations; gen++) {
      const currentGen = result[gen];
      if (currentGen.length === 0) break;

      const nextGen: IPerson[] = [];

      for (const p of currentGen) {
        const parentRels = await this.relationshipRepository.findParents(p._id);
        for (const rel of parentRels) {
          if (!visited.has(rel.fromPersonId)) {
            const parent = await this.personRepository.findById(rel.fromPersonId);
            if (parent) {
              nextGen.push(parent);
              visited.add(rel.fromPersonId);
            }
          }
        }
      }

      if (nextGen.length === 0) break;
      result.push(nextGen);
    }

    return {
      generations: result,
      depth: result.length,
    };
  }

  async getDescendants(personId: string, userId: string, generations: number = 10): Promise<AncestryPath> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundError('Person', personId);
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, person.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const result: IPerson[][] = [];
    const visited = new Set<string>();

    // Start with current person
    result.push([person]);
    visited.add(personId);

    // Build descendant tree
    for (let gen = 0; gen < generations; gen++) {
      const currentGen = result[gen];
      if (currentGen.length === 0) break;

      const nextGen: IPerson[] = [];

      for (const p of currentGen) {
        const childRels = await this.relationshipRepository.findChildren(p._id);
        for (const rel of childRels) {
          if (!visited.has(rel.toPersonId)) {
            const child = await this.personRepository.findById(rel.toPersonId);
            if (child) {
              nextGen.push(child);
              visited.add(rel.toPersonId);
            }
          }
        }
      }

      if (nextGen.length === 0) break;
      result.push(nextGen);
    }

    return {
      generations: result,
      depth: result.length,
    };
  }

  async validateRelationship(data: CreateRelationshipDto): Promise<string[]> {
    const errors: string[] = [];

    // Check if self-relationship
    if (data.fromPersonId === data.toPersonId) {
      errors.push('Cannot create relationship with same person');
    }

    // Check if persons exist (done in createRelationship, but validate here too)
    const [fromPerson, toPerson] = await Promise.all([
      this.personRepository.findById(data.fromPersonId),
      this.personRepository.findById(data.toPersonId),
    ]);

    if (!fromPerson) {
      errors.push('From person not found');
    }
    if (!toPerson) {
      errors.push('To person not found');
    }

    if (fromPerson && toPerson) {
      // Check if persons are in same tree
      if (fromPerson.treeId !== toPerson.treeId) {
        errors.push('Persons must belong to the same tree');
      }

      // Type-specific validations
      if (data.type === 'parent') {
        // Check if toPerson already has 2 parents
        const existingParents = await this.relationshipRepository.findParents(data.toPersonId);
        if (existingParents.length >= 2) {
          errors.push('Person can have maximum 2 parents');
        }
      }
    }

    return errors;
  }

  async checkForCycles(fromPersonId: string, toPersonId: string, type: RelationshipType): Promise<boolean> {
    if (type !== 'parent') return false;

    // Check if toPerson is already an ancestor of fromPerson
    const ancestors = await this.getAncestorIds(fromPersonId, new Set());
    return ancestors.has(toPersonId);
  }

  async suggestRelationships(personId: string, userId: string): Promise<IPerson[]> {
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundError('Person', personId);
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, person.treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    // Get all persons in the same tree
    const treePersons = await this.personRepository.findByTreeId(person.treeId);

    // Get existing relationships
    const existingRelationships = await this.relationshipRepository.findByPersonId(personId);
    const relatedPersonIds = new Set(
      existingRelationships.map((r) => (r.fromPersonId === personId ? r.toPersonId : r.fromPersonId))
    );

    // Filter out already related persons and self
    const suggestions = treePersons.filter(
      (p) => p._id !== personId && !relatedPersonIds.has(p._id)
    );

    // Sort by last name, then first name
    return suggestions.sort((a, b) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });
  }

  private async getAncestorIds(personId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(personId)) return visited;
    visited.add(personId);

    const parentRelationships = await this.relationshipRepository.findByPersonId(personId);
    const parents = parentRelationships.filter(
      (r) => r.type === 'parent' && r.toPersonId === personId
    );

    for (const parent of parents) {
      await this.getAncestorIds(parent.fromPersonId, visited);
    }

    return visited;
  }

  private async getPersonsByIds(ids: string[]): Promise<IPerson[]> {
    if (ids.length === 0) return [];
    return this.personRepository.findByIds(ids);
  }
}
