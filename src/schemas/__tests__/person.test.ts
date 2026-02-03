import { personFormSchema, personRelationshipSchema, genderEnum, relationshipTypeEnum } from '../person';

describe('Person Schemas', () => {
  describe('personFormSchema', () => {
    const validPerson = {
      firstName: 'John',
      lastName: 'Smith',
      gender: 'male' as const,
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

    describe('Date Validation', () => {
      it('should allow person without birth date', () => {
        const result = personFormSchema.safeParse(validPerson);
        expect(result.success).toBe(true);
      });

      it('should allow person with birth date', () => {
        const result = personFormSchema.safeParse({ ...validPerson, birthDate: '1950-01-01' });
        expect(result.success).toBe(true);
      });

      it('should allow person with death date when deceased', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          isDeceased: true,
          deathDate: '2020-01-01',
        });
        expect(result.success).toBe(true);
      });

      it('should allow person with death date even when not marked as deceased', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          isDeceased: false,
          deathDate: '2020-01-01',
        });
        expect(result.success).toBe(true);
      });

      it('should NOT require death date when deceased is checked', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          isDeceased: true,
        });
        expect(result.success).toBe(true);
      });

      it('should reject when death date equals birth date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          birthDate: '2020-01-01',
          deathDate: '2020-01-01',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Death date must be after birth date');
        }
      });

      it('should reject when death date is before birth date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          birthDate: '2020-01-01',
          deathDate: '2019-01-01',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Death date must be after birth date');
        }
      });

      it('should accept when death date is after birth date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          birthDate: '1950-01-01',
          deathDate: '2020-01-01',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid date format for birth date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          birthDate: 'invalid-date',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid date format');
        }
      });

      it('should reject invalid date format for death date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          deathDate: 'not-a-date',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid date format');
        }
      });

      it('should handle empty string as undefined for birth date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          birthDate: '' as unknown as undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should handle empty string as undefined for death date', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          deathDate: '' as unknown as undefined,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('Additional Fields', () => {
      it('should accept optional fields', () => {
        const result = personFormSchema.safeParse({
          ...validPerson,
          middleName: 'William',
          suffix: 'Jr.',
          birthDate: '1950-01-01',
          birthPlace: 'New York, USA',
          deathDate: '2020-01-01',
          deathPlace: 'Los Angeles, USA',
          biography: 'A person lived a full life.',
          occupation: 'Engineer',
          nationality: 'American',
          email: 'john@example.com',
          phone: '123-456-7890',
        });
        expect(result.success).toBe(true);
      });
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
