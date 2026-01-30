import { ITree } from '@/types/tree';
import { IPerson } from '@/types/person';
import { IRelationship } from '@/types/relationship';

/**
 * Export tree as PDF
 * Note: This is a minimal implementation. For full functionality,
 * you would need to:
 * 1. Use html2canvas to capture the ReactFlow canvas
 * 2. Add the captured image to the PDF
 * 3. Include more detailed tree information
 */
export async function exportTreeAsPDF(tree: ITree, persons: IPerson[], relationships: IRelationship[]): Promise<Buffer> {
  // For now, return a simple text-based PDF placeholder
  // In production, use jsPDF and html2canvas
  const content = `
Tree: ${tree.name}
Description: ${tree.description || 'N/A'}
Created: ${new Date(tree.createdAt).toLocaleDateString()}
Last Updated: ${new Date(tree.updatedAt).toLocaleDateString()}
Total Persons: ${persons.length}
Total Relationships: ${relationships.length}
  `;

  return Buffer.from(content, 'utf-8');
}

/**
 * Generate PDF filename for a tree
 */
export function getPDFFilename(treeName: string, treeId: string): string {
  const sanitizedName = treeName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `family-tree-${sanitizedName}-${treeId.slice(0, 8)}.pdf`;
}
