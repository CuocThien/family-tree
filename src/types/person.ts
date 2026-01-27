export type Gender = 'male' | 'female' | 'other' | 'unknown';

export interface ICustomAttribute {
  key: string;
  value: string | number | boolean;
}

/**
 * Domain type for Person entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface IPerson {
  _id: string;
  treeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: Gender;
  biography?: string;
  photos: string[];
  documents: string[];
  customAttributes: Map<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonData {
  treeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: Gender;
  biography?: string;
  photos?: string[];
  documents?: string[];
  customAttributes?: Map<string, string | number | boolean>;
}

export interface UpdatePersonData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: Gender;
  biography?: string;
  photos?: string[];
  documents?: string[];
  customAttributes?: Map<string, string | number | boolean>;
}
