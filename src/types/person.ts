export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type PrivacyLevel = 'public' | 'family' | 'private';

export interface ICustomAttribute {
  key: string;
  value: string | number | boolean;
}

export interface LifeEvent {
  type: 'birth' | 'death' | 'marriage' | 'divorce' | 'occupation' | 'education' | 'residence' | 'military' | 'immigration' | 'custom';
  title: string;
  date?: Date;
  endDate?: Date;
  location?: string;
  description?: string;
  sources?: string[];
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
  maidenName?: string;
  suffix?: string;
  nickname?: string;
  dateOfBirth?: Date;
  birthPlace?: string;
  dateOfDeath?: Date;
  deathPlace?: string;
  gender?: Gender;
  isLiving?: boolean;
  biography?: string;
  photos: string[];
  documents: string[];
  customAttributes: Map<string, string | number | boolean>;
  profilePhoto?: string;
  occupation?: string;
  nationality?: string;
  religion?: string;
  privacyLevel?: PrivacyLevel;
  dnaMatch?: string;
  hasDnaMatch?: boolean;
  lifeEvents?: LifeEvent[];
  customFields?: Record<string, string>;
  createdBy?: string;
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
