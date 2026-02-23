import { IRelationshipService, FamilyMembers, AncestryPath } from './IRelationshipService';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateRelationshipDto, UpdateRelationshipDto } from '@/types/dtos/relationship';
import { IRelationship, RelationshipType, FamilyUnit, PARENT_RELATIONSHIP_TYPES } from '@/types/relationship';
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

    // ROUTE TO SPECIALIZED METHODS

    // For spouse type, create bidirectional
    if (data.type === 'spouse') {
      const result = await this.createSpouseRelationship(
        treeId,
        userId,
        data.fromPersonId,
        data.toPersonId,
        { startDate: data.startDate, endDate: data.endDate, notes: data.notes }
      );
      return result.relationshipA;
    }

    // For parent type, determine father/mother based on gender
    if (data.type === 'parent') {
      return this.createParentRelationship(treeId, userId, data.fromPersonId, data.toPersonId);
    }

    // For father/mother types, validate and create
    if (data.type === 'father' || data.type === 'mother') {
      return this.createParentRelationshipWithType(treeId, userId, data.fromPersonId, data.toPersonId, data.type);
    }

    // 6. Create relationship (for other types)
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

  async createRelationshipsForPerson(
    treeId: string,
    userId: string,
    personId: string,
    relationships: Array<{ relatedPersonId: string; relationshipType: RelationshipType }>
  ): Promise<IRelationship[]> {
    // 1. Permission check
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_RELATIONSHIP);
    if (!canAdd) {
      throw new PermissionError('Permission denied');
    }

    // 2. Verify person exists and belongs to tree
    const person = await this.personRepository.findById(personId);
    if (!person || person.treeId !== treeId) {
      throw new NotFoundError('Person', personId);
    }

    // 3. Create all relationships
    const createdRelationships: IRelationship[] = [];
    const errors: string[] = [];

    for (const rel of relationships) {
      try {
        const relationship = await this.createRelationship(
          treeId,
          userId,
          {
            treeId,
            fromPersonId: rel.relatedPersonId,
            toPersonId: personId,
            type: rel.relationshipType,
          }
        );
        createdRelationships.push(relationship);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(`Failed to create relationship with ${rel.relatedPersonId}: ${error.message}`);
        }
      }
    }

    // 4. If any relationships failed, log the errors but don't fail the entire operation
    if (errors.length > 0) {
      console.warn('Some relationships failed to create:', errors);
    }

    return createdRelationships;
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
      if (data.type === 'parent' || data.type === 'father' || data.type === 'mother') {
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
    if (!PARENT_RELATIONSHIP_TYPES.includes(type)) return false;

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

  // ============================================================================
  // NEW METHODS: Bidirectional Spouse Relationships
  // ============================================================================

  async createSpouseRelationship(
    treeId: string,
    userId: string,
    personAId: string,
    personBId: string,
    data?: { startDate?: Date; endDate?: Date; notes?: string }
  ): Promise<{ relationshipA: IRelationship; relationshipB: IRelationship }> {
    // 1. Permission check
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_RELATIONSHIP);
    if (!canAdd) {
      throw new PermissionError('Permission denied');
    }

    // 2. Validate persons exist and belong to same tree
    const [personA, personB] = await Promise.all([
      this.personRepository.findById(personAId),
      this.personRepository.findById(personBId),
    ]);

    if (!personA || !personB) {
      throw new NotFoundError('Person', personA ? personBId : personAId);
    }

    if (personA.treeId !== treeId || personB.treeId !== treeId) {
      throw new BusinessRuleError('Persons must belong to the same tree');
    }

    // 3. Check for existing relationship in either direction
    const existingAtoB = await this.relationshipRepository.findBetweenPersons(personAId, personBId);
    const existingBtoA = await this.relationshipRepository.findBetweenPersons(personBId, personAId);

    if (existingAtoB || existingBtoA) {
      throw new BusinessRuleError('A relationship between these persons already exists');
    }

    // 4. Check for one active spouse only (if no end date)
    if (!data?.endDate) {
      const activeSpousesA = await this.getActiveSpouses(personAId);
      const activeSpousesB = await this.getActiveSpouses(personBId);

      if (activeSpousesA.length > 0) {
        throw new BusinessRuleError(`${personA.firstName} already has an active spouse. End the current marriage first.`);
      }
      if (activeSpousesB.length > 0) {
        throw new BusinessRuleError(`${personB.firstName} already has an active spouse. End the current marriage first.`);
      }
    }

    // 5. Create both directions
    const relationshipA = await this.relationshipRepository.create({
      treeId,
      fromPersonId: personAId,
      toPersonId: personBId,
      type: 'spouse',
      startDate: data?.startDate,
      endDate: data?.endDate,
      notes: data?.notes?.trim(),
    });

    const relationshipB = await this.relationshipRepository.create({
      treeId,
      fromPersonId: personBId,
      toPersonId: personAId,
      type: 'spouse',
      startDate: data?.startDate,
      endDate: data?.endDate,
      notes: data?.notes?.trim(),
    });

    // 6. Audit log
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'create',
      entityType: 'Relationship',
      entityId: relationshipA._id,
      changes: [{ field: 'bidirectional', oldValue: null, newValue: relationshipB._id }],
    });

    return { relationshipA, relationshipB };
  }

  async deleteBidirectionalRelationship(relationshipId: string, userId: string): Promise<void> {
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

    // 3. Find and delete the reverse relationship
    const reverseRelationship = await this.relationshipRepository.findBetweenPersons(
      existing.toPersonId,
      existing.fromPersonId
    );

    // Delete both
    await this.relationshipRepository.delete(relationshipId);

    if (reverseRelationship) {
      await this.relationshipRepository.delete(reverseRelationship._id);
    }

    // 4. Audit log
    await this.auditLogRepository.create({
      treeId: existing.treeId,
      userId,
      action: 'delete',
      entityType: 'Relationship',
      entityId: relationshipId,
      changes: [{ field: 'bidirectional', oldValue: reverseRelationship?._id || null, newValue: null }],
    });
  }

  // ============================================================================
  // NEW METHODS: Father/Mother Relationship Logic
  // ============================================================================

  async createParentRelationship(
    treeId: string,
    userId: string,
    parentId: string,
    childId: string
  ): Promise<IRelationship> {
    // 1. Get parent's gender to determine type
    const parent = await this.personRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundError('Person', parentId);
    }

    // 2. Determine relationship type based on gender
    const type: RelationshipType = parent.gender === 'male' ? 'father' :
                                   parent.gender === 'female' ? 'mother' : 'parent';

    return this.createParentRelationshipWithType(treeId, userId, parentId, childId, type);
  }

  private async createParentRelationshipWithType(
    treeId: string,
    userId: string,
    parentId: string,
    childId: string,
    type: 'father' | 'mother' | 'parent'
  ): Promise<IRelationship> {
    // 1. Permission check
    const canAdd = await this.permissionService.canAccess(userId, treeId, Permission.ADD_RELATIONSHIP);
    if (!canAdd) {
      throw new PermissionError('Permission denied');
    }

    // 2. Validate persons exist and belong to same tree
    const [parent, child] = await Promise.all([
      this.personRepository.findById(parentId),
      this.personRepository.findById(childId),
    ]);

    if (!parent || !child) {
      throw new NotFoundError('Person', parent ? childId : parentId);
    }

    if (parent.treeId !== treeId || child.treeId !== treeId) {
      throw new BusinessRuleError('Persons must belong to the same tree');
    }

    // 3. Check if child already has maximum parents
    const existingParents = await this.relationshipRepository.findParents(childId);
    if (existingParents.length >= 2) {
      throw new BusinessRuleError('Person can have maximum 2 parents');
    }

    // 4. Check for cycles
    const hasCycle = await this.checkForCycles(parentId, childId, type);
    if (hasCycle) {
      throw new BusinessRuleError('This relationship would create an impossible cycle');
    }

    // 5. Check for duplicate relationship
    const existingRelationship = await this.relationshipRepository.findBetweenPersons(parentId, childId);
    if (existingRelationship) {
      throw new BusinessRuleError('A relationship between these persons already exists');
    }

    // 6. Create relationship
    const relationship = await this.relationshipRepository.create({
      treeId,
      fromPersonId: parentId,
      toPersonId: childId,
      type,
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

  async updateParentRelationshipsOnGenderChange(
    personId: string,
    newGender: string,
    userId: string
  ): Promise<void> {
    // 1. Get the person
    const person = await this.personRepository.findById(personId);
    if (!person) {
      throw new NotFoundError('Person', personId);
    }

    // 2. Check permission
    const canEdit = await this.permissionService.canAccess(userId, person.treeId, Permission.ADD_RELATIONSHIP);
    if (!canEdit) {
      throw new PermissionError('Permission denied');
    }

    // 3. Find all relationships where this person is a parent (father/mother/parent)
    const allRelationships = await this.relationshipRepository.findByPersonId(personId);
    const parentRelationships = allRelationships.filter(
      (r) => r.fromPersonId === personId && PARENT_RELATIONSHIP_TYPES.includes(r.type)
    );

    // 4. Determine the new type based on gender
    const newType: RelationshipType = newGender === 'male' ? 'father' :
                                       newGender === 'female' ? 'mother' : 'parent';

    // 5. Update each parent relationship
    for (const rel of parentRelationships) {
      if (rel.type !== newType) {
        await this.relationshipRepository.update(rel._id, { type: newType });

        // Audit log
        await this.auditLogRepository.create({
          treeId: person.treeId,
          userId,
          action: 'update',
          entityType: 'Relationship',
          entityId: rel._id,
          changes: [{ field: 'type', oldValue: rel.type, newValue: newType }],
        });
      }
    }
  }

  // ============================================================================
  // NEW METHODS: Family Unit Detection
  // ============================================================================

  async getFamilyUnits(treeId: string, userId: string): Promise<FamilyUnit[]> {
    // 1. Permission check
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    // 2. Get all persons and relationships in the tree
    const [persons, relationships] = await Promise.all([
      this.personRepository.findByTreeId(treeId),
      this.relationshipRepository.findByTreeId(treeId),
    ]);

    const personMap = new Map(persons.map((p) => [p._id, p]));
    const familyUnits: FamilyUnit[] = [];
    const processedSpouses = new Set<string>();

    // 3. Find all spouse relationships
    const spouseRelationships = relationships.filter((r) => r.type === 'spouse');

    // 4. Build family units from spouse pairs
    for (const spouseRel of spouseRelationships) {
      const spouse1Id = spouseRel.fromPersonId;
      const spouse2Id = spouseRel.toPersonId;

      // Create unique key for this spouse pair (always use lexicographically smaller ID first)
      const pairKey = [spouse1Id, spouse2Id].sort().join('-');

      // Skip if already processed
      if (processedSpouses.has(pairKey)) {
        continue;
      }
      processedSpouses.add(pairKey);

      const spouse1 = personMap.get(spouse1Id);
      const spouse2 = personMap.get(spouse2Id);

      if (!spouse1) continue;

      // Find children of this spouse pair (children who have both as parents)
      const children: IPerson[] = [];

      for (const person of persons) {
        const parentRelationships = relationships.filter(
          (r) => r.toPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
        );

        const parentIds = parentRelationships.map((r) => r.fromPersonId);

        // Check if this person has both spouses as parents
        const hasSpouse1AsParent = parentIds.includes(spouse1Id);
        const hasSpouse2AsParent = spouse2 ? parentIds.includes(spouse2Id) : false;

        // For a couple with spouse2, child should have both parents
        // For single parent (spouse2 is null), child should have spouse1 as parent
        if (spouse2) {
          if (hasSpouse1AsParent && hasSpouse2AsParent) {
            children.push(person);
          }
        } else {
          if (hasSpouse1AsParent) {
            children.push(person);
          }
        }
      }

      familyUnits.push({
        id: pairKey,
        spouse1,
        spouse2: spouse2 || null,
        children,
        generationLevel: 0, // Will be calculated by layout algorithm
      });
    }

    // 5. Handle single parents (persons with children but no spouse)
    for (const person of persons) {
      const personSpouseRelationships = spouseRelationships.filter(
        (r) => r.fromPersonId === person._id || r.toPersonId === person._id
      );

      // Skip if this person has a spouse relationship
      if (personSpouseRelationships.length > 0) {
        continue;
      }

      // Find children
      const childRelationships = relationships.filter(
        (r) => r.fromPersonId === person._id && PARENT_RELATIONSHIP_TYPES.includes(r.type)
      );

      if (childRelationships.length > 0) {
        const children: IPerson[] = [];

        for (const childRel of childRelationships) {
          const child = personMap.get(childRel.toPersonId);
          if (child) {
            children.push(child);
          }
        }

        if (children.length > 0) {
          familyUnits.push({
            id: `single-${person._id}`,
            spouse1: person,
            spouse2: null,
            children,
            generationLevel: 0,
          });
        }
      }
    }

    return familyUnits;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async getActiveSpouses(personId: string): Promise<IRelationship[]> {
    const allSpouseRelationships = await this.relationshipRepository.findByPersonIdAndType(personId, 'spouse');

    // Filter to only active spouses (no end date)
    return allSpouseRelationships.filter((r) => !r.endDate);
  }

  private async getAncestorIds(personId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(personId)) return visited;
    visited.add(personId);

    const parentRelationships = await this.relationshipRepository.findByPersonId(personId);
    const parents = parentRelationships.filter(
      (r) => PARENT_RELATIONSHIP_TYPES.includes(r.type) && r.toPersonId === personId
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
