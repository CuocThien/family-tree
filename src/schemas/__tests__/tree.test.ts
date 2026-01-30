import { treeSchema, treeFormSchema } from '../tree';

describe('Tree Schemas', () => {
  describe('treeSchema', () => {
    const validTree = {
      name: 'Smith Family Tree',
      description: 'The Smith family lineage',
      rootPersonId: 'person-1',
      isPublic: false,
    };

    it('should validate a valid tree', () => {
      const result = treeSchema.safeParse(validTree);
      expect(result.success).toBe(true);
    });

    it('should require name', () => {
      const result = treeSchema.safeParse({ ...validTree, name: '' });
      expect(result.success).toBe(false);
    });

    it('should limit name length', () => {
      const result = treeSchema.safeParse({ ...validTree, name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should accept optional description', () => {
      const result = treeSchema.safeParse({ ...validTree, description: undefined });
      expect(result.success).toBe(true);
    });
  });

  describe('treeFormSchema', () => {
    const validForm = {
      name: 'My Family Tree',
      description: 'A description',
    };

    it('should validate form input', () => {
      const result = treeFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });
  });
});
