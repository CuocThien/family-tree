import { ITreeService, TreeStats, TreeExportData } from './ITreeService';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { IMediaRepository } from '@/repositories/interfaces/IMediaRepository';
import { IPermissionService, Permission } from '@/services/permission/IPermissionService';
import { IAuditRepository } from '@/repositories/interfaces/IAuditRepository';
import { CreateTreeDto, UpdateTreeDto } from '@/types/dtos/tree';
import { ITree, ITreeSettings } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';
import { PermissionError, NotFoundError, ValidationError, BusinessRuleError } from '@/services/errors/ServiceErrors';
import { CreateTreeDtoSchema, UpdateTreeDtoSchema } from '@/types/dtos/tree';

const DEFAULT_TREE_SETTINGS: ITreeSettings = {
  isPublic: false,
  allowComments: false,
  defaultPhotoQuality: 'medium',
  language: 'en',
};

export class TreeService implements ITreeService {
  constructor(
    private readonly treeRepository: ITreeRepository,
    private readonly personRepository: IPersonRepository,
    private readonly relationshipRepository: IRelationshipRepository,
    private readonly mediaRepository: IMediaRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditLogRepository: IAuditRepository
  ) {}

  async createTree(userId: string, data: CreateTreeDto): Promise<ITree> {
    // 1. Validate input
    const result = CreateTreeDtoSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(errors);
    }

    // 2. Sanitize input
    const sanitizedName = data.name.trim();

    // 3. Validate root person if provided
    if (data.rootPersonId) {
      const rootPerson = await this.personRepository.findById(data.rootPersonId);
      if (!rootPerson) {
        throw new NotFoundError('Person', data.rootPersonId);
      }
    }

    // 4. Create tree
    const tree = await this.treeRepository.create({
      ownerId: userId,
      name: sanitizedName,
      rootPersonId: data.rootPersonId,
      settings: {
        ...DEFAULT_TREE_SETTINGS,
        ...data.settings,
      },
    });

    // 5. Audit log
    await this.auditLogRepository.create({
      treeId: tree._id,
      userId,
      action: 'create',
      entityType: 'FamilyTree',
      entityId: tree._id,
      changes: [],
    });

    return tree;
  }

  async updateTree(treeId: string, userId: string, data: UpdateTreeDto): Promise<ITree> {
    // 1. Get existing tree
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new NotFoundError('FamilyTree', treeId);
    }

    // 2. Check permission
    const canEdit = await this.permissionService.canAccess(userId, treeId, Permission.EDIT_TREE);
    if (!canEdit) {
      throw new PermissionError('Permission denied: Cannot edit this tree');
    }

    // 3. Validate input
    const result = UpdateTreeDtoSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ValidationError(errors);
    }

    // 4. Sanitize input
    const updateData: UpdateTreeDto = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.rootPersonId !== undefined) {
      // Validate root person exists
      if (data.rootPersonId) {
        const rootPerson = await this.personRepository.findById(data.rootPersonId);
        if (!rootPerson) {
          throw new NotFoundError('Person', data.rootPersonId);
        }
      }
      updateData.rootPersonId = data.rootPersonId;
    }
    if (data.settings !== undefined) {
      updateData.settings = data.settings;
    }

    // 5. Update tree
    const updatedTree = await this.treeRepository.update(treeId, updateData);

    // 6. Audit log
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'update',
      entityType: 'FamilyTree',
      entityId: treeId,
      changes: [],
    });

    return updatedTree;
  }

  async deleteTree(treeId: string, userId: string): Promise<void> {
    // 1. Check ownership (only owner can delete)
    const isOwner = await this.treeRepository.isOwner(treeId, userId);
    if (!isOwner) {
      throw new PermissionError('Only tree owner can delete');
    }

    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new NotFoundError('FamilyTree', treeId);
    }

    // 2. Delete all related data (cascade)
    await this.relationshipRepository.deleteByTreeId(treeId);
    await this.personRepository.deleteByTreeId(treeId);
    await this.mediaRepository.deleteByTreeId(treeId);

    // 3. Delete tree
    await this.treeRepository.delete(treeId);

    // 4. Audit log (before tree is deleted)
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'delete',
      entityType: 'FamilyTree',
      entityId: treeId,
      changes: [],
    });
  }

  async getTreeById(treeId: string, userId: string): Promise<ITree | null> {
    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      return null;
    }

    // Check permission
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied: Cannot view this tree');
    }

    return tree;
  }

  async getTreesByUserId(userId: string): Promise<ITree[]> {
    return this.treeRepository.findByOwnerId(userId);
  }

  async getSharedTrees(userId: string): Promise<ITree[]> {
    return this.treeRepository.findByCollaboratorId(userId);
  }

  async getTreeStats(treeId: string, userId: string): Promise<TreeStats> {
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const [persons, relationships, media] = await Promise.all([
      this.personRepository.findByTreeId(treeId),
      this.relationshipRepository.findByTreeId(treeId),
      this.mediaRepository.findByTreeId(treeId),
    ]);

    const oldestPerson = persons.reduce((oldest, person) => {
      if (!person.dateOfBirth) return oldest;
      if (!oldest?.dateOfBirth) return person;
      return new Date(person.dateOfBirth) < new Date(oldest.dateOfBirth) ? person : oldest;
    }, null as IPerson | null);

    const newestPerson = persons.reduce((newest, person) => {
      if (!person.dateOfBirth) return newest;
      if (!newest?.dateOfBirth) return person;
      return new Date(person.dateOfBirth) > new Date(newest.dateOfBirth) ? person : newest;
    }, null as IPerson | null);

    return {
      memberCount: persons.length,
      relationshipCount: relationships.length,
      mediaCount: media.length,
      oldestPerson: oldestPerson || undefined,
      newestPerson: newestPerson || undefined,
      generations: this.calculateGenerations(persons, relationships),
    };
  }

  async exportTree(treeId: string, userId: string, format: 'json' | 'gedcom'): Promise<TreeExportData> {
    const canExport = await this.permissionService.canAccess(userId, treeId, Permission.EXPORT_TREE);
    if (!canExport) {
      throw new PermissionError('Permission denied: Cannot export this tree');
    }

    const tree = await this.treeRepository.findById(treeId);
    if (!tree) {
      throw new NotFoundError('FamilyTree', treeId);
    }

    const [persons, relationships] = await Promise.all([
      this.personRepository.findByTreeId(treeId),
      this.relationshipRepository.findByTreeId(treeId),
    ]);

    // Audit log
    await this.auditLogRepository.create({
      treeId,
      userId,
      action: 'export',
      entityType: 'FamilyTree',
      entityId: treeId,
      changes: [],
    });

    return {
      tree,
      persons,
      relationships,
    };
  }

  async importTree(userId: string, data: TreeExportData): Promise<ITree> {
    // 1. Validate input
    if (!data.tree || !data.persons) {
      throw new ValidationError(['Invalid import data: tree and persons are required']);
    }

    // 2. Create new tree
    const newTree = await this.treeRepository.create({
      ownerId: userId,
      name: `${data.tree.name} (Imported)`,
      settings: data.tree.settings || DEFAULT_TREE_SETTINGS,
    });

    // 3. Create person ID mapping for relationships
    const personIdMap = new Map<string, string>();

    // 4. Import persons
    for (const person of data.persons) {
      const newPerson = await this.personRepository.create({
        treeId: newTree._id,
        firstName: person.firstName,
        lastName: person.lastName,
        middleName: person.middleName,
        dateOfBirth: person.dateOfBirth,
        dateOfDeath: person.dateOfDeath,
        gender: person.gender,
        biography: person.biography,
        photos: person.photos,
        documents: person.documents,
        customAttributes: person.customAttributes,
      });
      personIdMap.set(person._id, newPerson._id);
    }

    // 5. Import relationships with updated IDs
    if (data.relationships) {
      for (const relationship of data.relationships) {
        const newFromPersonId = personIdMap.get(relationship.fromPersonId);
        const newToPersonId = personIdMap.get(relationship.toPersonId);

        if (newFromPersonId && newToPersonId) {
          await this.relationshipRepository.create({
            treeId: newTree._id,
            fromPersonId: newFromPersonId,
            toPersonId: newToPersonId,
            type: relationship.type,
            startDate: relationship.startDate,
            endDate: relationship.endDate,
            notes: relationship.notes,
          });
        }
      }
    }

    // 6. Audit log
    await this.auditLogRepository.create({
      treeId: newTree._id,
      userId,
      action: 'create',
      entityType: 'FamilyTree',
      entityId: newTree._id,
      changes: [],
    });

    return newTree;
  }

  async getTreeVisualizationData(treeId: string, userId: string, viewType: string): Promise<unknown> {
    const canView = await this.permissionService.canAccess(userId, treeId, Permission.VIEW_TREE);
    if (!canView) {
      throw new PermissionError('Permission denied');
    }

    const [persons, relationships] = await Promise.all([
      this.personRepository.findByTreeId(treeId),
      this.relationshipRepository.findByTreeId(treeId),
    ]);

    // Return data structure suitable for visualization
    return {
      viewType,
      persons,
      relationships,
    };
  }

  private calculateGenerations(persons: IPerson[], relationships: IRelationship[]): number {
    if (persons.length === 0) return 0;

    // Find root person (someone with no parents in the tree)
    const personIds = new Set(persons.map((p) => p._id));
    const parentRelationships = relationships.filter((r) => r.type === 'parent');
    const childrenWithParents = new Set(parentRelationships.map((r) => r.toPersonId));
    const rootPersons = persons.filter((p) => !childrenWithParents.has(p._id));

    if (rootPersons.length === 0) {
      // Circular reference or no clear root - estimate from dates
      const birthYears = persons
        .map((p) => p.dateOfBirth?.getFullYear())
        .filter((y): y is number => y !== undefined);
      if (birthYears.length === 0) return 1;
      const minYear = Math.min(...birthYears);
      const maxYear = Math.max(...birthYears);
      return Math.max(1, Math.ceil((maxYear - minYear) / 25)); // Assume 25 years per generation
    }

    // Calculate max depth using BFS from root persons
    let maxDepth = 1;
    const visited = new Set<string>();

    for (const rootPerson of rootPersons) {
      const depth = this.getDepth(rootPerson._id, relationships, visited);
      maxDepth = Math.max(maxDepth, depth);
    }

    return maxDepth;
  }

  private getDepth(personId: string, relationships: IRelationship[], visited: Set<string>): number {
    if (visited.has(personId)) return 0;
    visited.add(personId);

    const childRelationships = relationships.filter(
      (r) => r.type === 'parent' && r.fromPersonId === personId
    );

    if (childRelationships.length === 0) return 1;

    let maxChildDepth = 0;
    for (const rel of childRelationships) {
      const childDepth = this.getDepth(rel.toPersonId, relationships, visited);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth + 1;
  }
}
