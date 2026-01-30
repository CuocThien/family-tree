import { personFormSchema, personRelationshipSchema, genderEnum, relationshipTypeEnum } from '../person';

describe('Person Schemas', () => {
  describe('personFormSchema', () => {
    const validPerson = {
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male',
      birthDate: '1950-01-01',
      isDeceased: false,
    };

    it('should validate a valid person', () => {
      const result = personFormSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
    });

    it('should require first name', () => {
      const result = personFormSchema.safeParse({ ...validPerson, firstName: '' });
      expect(result.success).toBe(false);
    });

    it('should require last name', () => {
      const result = personFormSchema.safeParse({ ...validPerson, lastName: '' });
      expect(result.success).toBe(false);
    });

    it('should require gender', () => {
      const result = personFormSchema.safeParse({ ...validPerson, gender: undefined });
      expect(result.success).toBe(false);
    });

    it('should accept valid gender values', () => {
      const genders = ['male', 'female', 'other'] as const;
      genders.forEach((gender) => {
        const result = personFormSchema.safeParse({ ...validPerson, gender });
        expect(result.success).toBe(true);
      });
    });

    it('should validate death date when deceased', () => {
      const result = personFormSchema.safeParse({
        ...validPerson,
        isDeceased: true,
        deathDate: '2020-01-01',
      });
      expect(result.success).toBe(true);
    });

    it('should require death date when deceased', () => {
      const result = personFormSchema.safeParse({
        ...validPerson,
        isDeceased: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('personRelationshipSchema', () => {
    it('should validate relationship type', () => {
      const result = personRelationshipSchema.safeParse({
        relationshipType: 'child',
        relatedPersonId: 'person-123',
      });
      expect(result.success).toBe(true);
    });

    it('should require related person ID', () => {
      const result = personRelationshipSchema.safeParse({
        relationshipType: 'child',
      });
      expect(result.success).toBe(false);
    });
  });
});
