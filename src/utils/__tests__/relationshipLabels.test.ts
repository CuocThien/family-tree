import { getGenderAwareLabel, getRelationshipDescription, getRelationshipIcon } from '../relationshipLabels';
import { RelationshipType } from '@/schemas/person';
import { Gender } from '@/types/person';

describe('relationshipLabels', () => {
  describe('getGenderAwareLabel', () => {
    describe('parent type', () => {
      it('should return "Father" for male gender', () => {
        expect(getGenderAwareLabel('parent', 'male')).toBe('Father');
      });

      it('should return "Mother" for female gender', () => {
        expect(getGenderAwareLabel('parent', 'female')).toBe('Mother');
      });

      it('should return "Parent" when gender is undefined', () => {
        expect(getGenderAwareLabel('parent')).toBe('Parent');
      });
    });

    describe('child type', () => {
      it('should return "Son" for male gender', () => {
        expect(getGenderAwareLabel('child', 'male')).toBe('Son');
      });

      it('should return "Daughter" for female gender', () => {
        expect(getGenderAwareLabel('child', 'female')).toBe('Daughter');
      });

      it('should return "Child" when gender is undefined', () => {
        expect(getGenderAwareLabel('child')).toBe('Child');
      });
    });

    describe('spouse type', () => {
      it('should return "Husband" for male gender', () => {
        expect(getGenderAwareLabel('spouse', 'male')).toBe('Husband');
      });

      it('should return "Wife" for female gender', () => {
        expect(getGenderAwareLabel('spouse', 'female')).toBe('Wife');
      });

      it('should return "Spouse" when gender is undefined', () => {
        expect(getGenderAwareLabel('spouse')).toBe('Spouse');
      });
    });

    describe('sibling type', () => {
      it('should return "Brother" for male gender', () => {
        expect(getGenderAwareLabel('sibling', 'male')).toBe('Brother');
      });

      it('should return "Sister" for female gender', () => {
        expect(getGenderAwareLabel('sibling', 'female')).toBe('Sister');
      });

      it('should return "Sibling" when gender is undefined', () => {
        expect(getGenderAwareLabel('sibling')).toBe('Sibling');
      });
    });

    describe('step-parent type', () => {
      it('should return "Step Father" for male gender', () => {
        expect(getGenderAwareLabel('step-parent', 'male')).toBe('Step Father');
      });

      it('should return "Step Mother" for female gender', () => {
        expect(getGenderAwareLabel('step-parent', 'female')).toBe('Step Mother');
      });

      it('should return "Step Parent" when gender is undefined', () => {
        expect(getGenderAwareLabel('step-parent')).toBe('Step Parent');
      });
    });

    describe('step-child type', () => {
      it('should return "Step Son" for male gender', () => {
        expect(getGenderAwareLabel('step-child', 'male')).toBe('Step Son');
      });

      it('should return "Step Daughter" for female gender', () => {
        expect(getGenderAwareLabel('step-child', 'female')).toBe('Step Daughter');
      });

      it('should return "Step Child" when gender is undefined', () => {
        expect(getGenderAwareLabel('step-child')).toBe('Step Child');
      });
    });

    describe('adoptive-parent type', () => {
      it('should return "Adoptive Father" for male gender', () => {
        expect(getGenderAwareLabel('adoptive-parent', 'male')).toBe('Adoptive Father');
      });

      it('should return "Adoptive Mother" for female gender', () => {
        expect(getGenderAwareLabel('adoptive-parent', 'female')).toBe('Adoptive Mother');
      });

      it('should return "Adoptive Parent" when gender is undefined', () => {
        expect(getGenderAwareLabel('adoptive-parent')).toBe('Adoptive Parent');
      });
    });

    describe('adoptive-child type', () => {
      it('should return "Adoptive Son" for male gender', () => {
        expect(getGenderAwareLabel('adoptive-child', 'male')).toBe('Adoptive Son');
      });

      it('should return "Adoptive Daughter" for female gender', () => {
        expect(getGenderAwareLabel('adoptive-child', 'female')).toBe('Adoptive Daughter');
      });

      it('should return "Adoptive Child" when gender is undefined', () => {
        expect(getGenderAwareLabel('adoptive-child')).toBe('Adoptive Child');
      });
    });

    describe('partner type', () => {
      it('should return "Partner" regardless of gender', () => {
        expect(getGenderAwareLabel('partner', 'male')).toBe('Partner');
        expect(getGenderAwareLabel('partner', 'female')).toBe('Partner');
        expect(getGenderAwareLabel('partner')).toBe('Partner');
      });
    });
  });

  describe('getRelationshipDescription', () => {
    it('should return description for parent relationship', () => {
      expect(getRelationshipDescription('parent', 'John', 'male')).toBe('John is the father of this person');
    });

    it('should return description for child relationship', () => {
      expect(getRelationshipDescription('child', 'Mary', 'female')).toBe('Mary is the daughter of this person');
    });

    it('should return description for spouse relationship', () => {
      expect(getRelationshipDescription('spouse', 'Jane', 'female')).toBe('Jane is the wife of this person');
    });

    it('should return description for sibling relationship', () => {
      expect(getRelationshipDescription('sibling', 'Bob', 'male')).toBe('Bob is the brother of this person');
    });

    it('should return description for step-parent relationship', () => {
      expect(getRelationshipDescription('step-parent', 'Tom', 'male')).toBe('Tom is the step father of this person');
    });

    it('should return description for partner relationship', () => {
      expect(getRelationshipDescription('partner', 'Alex')).toBe('Alex is the partner of this person');
    });
  });

  describe('getRelationshipIcon', () => {
    it('should return "north" for parent types', () => {
      expect(getRelationshipIcon('parent')).toBe('north');
      expect(getRelationshipIcon('step-parent')).toBe('north');
      expect(getRelationshipIcon('adoptive-parent')).toBe('north');
    });

    it('should return "south" for child types', () => {
      expect(getRelationshipIcon('child')).toBe('south');
      expect(getRelationshipIcon('step-child')).toBe('south');
      expect(getRelationshipIcon('adoptive-child')).toBe('south');
    });

    it('should return "favorite" for spouse and partner types', () => {
      expect(getRelationshipIcon('spouse')).toBe('favorite');
      expect(getRelationshipIcon('partner')).toBe('favorite');
    });

    it('should return "group" for sibling type', () => {
      expect(getRelationshipIcon('sibling')).toBe('group');
    });
  });
});
