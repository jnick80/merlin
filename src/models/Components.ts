// Identity
export interface Identity {
  id: string;
  entityId: string;
  identifierType: string;
  identifierValue: string;
  isPrimary: boolean;
  createdAt: Date;
}

// State
export interface State {
  id: string;
  entityId: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Facts
export interface Fact {
  id: string;
  entityId: string;
  factType: string;
  factValue: string;
  source?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Intelligence
export interface Intelligence {
  id: string;
  entityId: string;
  insightType: string;
  insightData: Record<string, any>;
  confidenceScore?: number;
  createdAt: Date;
}

// Assets
export interface Asset {
  id: string;
  entityId: string;
  assetType: string;
  assetName: string;
  assetData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Operations
export interface Operation {
  id: string;
  entityId: string;
  operationType: string;
  operationData: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// Performance
export interface PerformanceMetric {
  id: string;
  entityId: string;
  metricName: string;
  metricValue: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

// Relationships
export interface Relationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  relationshipData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// History
export interface HistoryEvent {
  id: string;
  entityId: string;
  eventType: string;
  eventData: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

// Automation
export interface Automation {
  id: string;
  entityId: string;
  automationName: string;
  automationType: string;
  automationRules: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
