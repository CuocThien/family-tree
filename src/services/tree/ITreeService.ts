import { ITree } from '@/types/tree';
import { CreateTreeDto, UpdateTreeDto } from '@/types/dtos/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

export interface TreeStats {
  memberCount: number;
  relationshipCount: number;
  mediaCount: number;
  oldestPerson?: IPerson;
  newestPerson?: IPerson;
  generations: number;
}

export interface TreeExportData {
  tree: ITree;
  persons: IPerson[];
  relationships: IRelationship[];
}

/**
 * Service interface for FamilyTree entity operations.
 * Handles business logic, validation, export/import, and statistics.
 */
export interface ITreeService {
  // CRUD Operations
  createTree(userId: string, data: CreateTreeDto): Promise<ITree>;
  updateTree(treeId: string, userId: string, data: UpdateTreeDto): Promise<ITree>;
  deleteTree(treeId: string, userId: string): Promise<void>;
  getTreeById(treeId: string, userId: string): Promise<ITree | null>;

  // List Operations
  getTreesByUserId(userId: string): Promise<ITree[]>;
  getSharedTrees(userId: string): Promise<ITree[]>;

  // Statistics
  getTreeStats(treeId: string, userId: string): Promise<TreeStats>;

  // Export/Import
  exportTree(treeId: string, userId: string, format: 'json' | 'gedcom'): Promise<TreeExportData>;
  importTree(userId: string, data: TreeExportData): Promise<ITree>;

  // Visualization
  getTreeVisualizationData(treeId: string, userId: string, viewType: string): Promise<unknown>;
}
