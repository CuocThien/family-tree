export type GenerationFilter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type GenderFilter = 'male' | 'female' | 'other';
export type LifeStatusFilter = 'all' | 'living' | 'deceased';

export interface TreeFilters {
  generations?: GenerationFilter;
  branches?: string[];
  gender?: GenderFilter[];
  lifeStatus?: LifeStatusFilter;
}
