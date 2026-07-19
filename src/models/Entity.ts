export interface Entity {
  id: string;
  type: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateEntityRequest {
  type: string;
  name: string;
  description?: string;
}

export interface UpdateEntityRequest {
  name?: string;
  description?: string;
}
