export type MediaType = 'photo' | 'document';

export interface IMediaMetadata {
  width?: number;
  height?: number;
  location?: string;
  dateTaken?: Date;
  description?: string;
}

/**
 * Domain type for Media entity
 * Note: Uses string for IDs instead of mongoose.Types.ObjectId
 */
export interface IMedia {
  _id: string;
  treeId: string;
  personId?: string;
  type: MediaType;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  metadata: IMediaMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMediaData {
  treeId: string;
  personId?: string;
  type: MediaType;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  metadata?: Partial<IMediaMetadata>;
}

export interface UpdateMediaData {
  personId?: string;
  metadata?: Partial<IMediaMetadata>;
}
