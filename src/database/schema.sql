CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  identifier_type VARCHAR(50) NOT NULL,
  identifier_value VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_id, identifier_type, identifier_value)
);

CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  fact_type VARCHAR(100) NOT NULL,
  fact_value TEXT NOT NULL,
  source VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  insight_type VARCHAR(100) NOT NULL,
  insight_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  asset_type VARCHAR(100) NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  operation_type VARCHAR(100) NOT NULL,
  operation_data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15, 4) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100) NOT NULL,
  relationship_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  automation_name VARCHAR(255) NOT NULL,
  automation_type VARCHAR(100) NOT NULL,
  automation_rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_workloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
  owner_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  desired_image VARCHAR(255),
  runtime_class VARCHAR(100) NOT NULL DEFAULT 'local-simulated',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  network_exposed BOOLEAN NOT NULL DEFAULT FALSE,
  resource_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, name)
);

CREATE TABLE IF NOT EXISTS runtime_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
  workload_id UUID NOT NULL REFERENCES platform_workloads(id) ON DELETE CASCADE,
  owner_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  health_status VARCHAR(50) NOT NULL DEFAULT 'unknown',
  isolation_mode VARCHAR(100) NOT NULL,
  template VARCHAR(100) NOT NULL,
  assigned_node VARCHAR(255),
  launch_request JSONB NOT NULL DEFAULT '{}'::jsonb,
  runtime_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS runtime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runtime_instance_id UUID NOT NULL REFERENCES runtime_instances(id) ON DELETE CASCADE,
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_manufacturers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  supported_code_systems JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL REFERENCES tractor_manufacturers(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  family VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  production_years VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostic_code_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID NOT NULL REFERENCES tractor_manufacturers(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  self_service_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  safety_warning TEXT NOT NULL,
  probable_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  maintenance_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
  repair_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalation_advice TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostic_code_models (
  diagnostic_code_id UUID NOT NULL REFERENCES diagnostic_code_definitions(id) ON DELETE CASCADE,
  tractor_model_id UUID NOT NULL REFERENCES tractor_models(id) ON DELETE CASCADE,
  PRIMARY KEY (diagnostic_code_id, tractor_model_id)
);

CREATE TABLE IF NOT EXISTS symptom_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_id UUID REFERENCES tractor_manufacturers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL,
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  guidance_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  escalation_advice TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS symptom_guide_models (
  symptom_guide_id UUID NOT NULL REFERENCES symptom_guides(id) ON DELETE CASCADE,
  tractor_model_id UUID NOT NULL REFERENCES tractor_models(id) ON DELETE CASCADE,
  PRIMARY KEY (symptom_guide_id, tractor_model_id)
);

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tractor_model_id UUID NOT NULL REFERENCES tractor_models(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  interval_hours INTEGER,
  interval_days INTEGER,
  required_parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tractor_model_id UUID NOT NULL REFERENCES tractor_models(id) ON DELETE CASCADE,
  equipment_identifier VARCHAR(255),
  code VARCHAR(100),
  symptom_text TEXT,
  action_taken TEXT,
  performed_by VARCHAR(255),
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_identities_entity_id ON identities(entity_id);
CREATE INDEX idx_states_entity_id ON states(entity_id);
CREATE INDEX idx_facts_entity_id ON facts(entity_id);
CREATE INDEX idx_intelligence_entity_id ON intelligence(entity_id);
CREATE INDEX idx_assets_entity_id ON assets(entity_id);
CREATE INDEX idx_operations_entity_id ON operations(entity_id);
CREATE INDEX idx_performance_entity_id ON performance(entity_id);
CREATE INDEX idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX idx_history_entity_id ON history(entity_id);
CREATE INDEX idx_automations_entity_id ON automations(entity_id);
CREATE INDEX idx_platform_workloads_owner_id ON platform_workloads(owner_id);
CREATE INDEX idx_runtime_instances_workload_id ON runtime_instances(workload_id);
CREATE INDEX idx_runtime_instances_owner_id ON runtime_instances(owner_id);
CREATE INDEX idx_runtime_instances_status ON runtime_instances(status);
CREATE INDEX idx_runtime_logs_runtime_instance_id ON runtime_logs(runtime_instance_id);
CREATE INDEX idx_tractor_models_manufacturer_id ON tractor_models(manufacturer_id);
CREATE INDEX idx_diagnostic_codes_manufacturer_id ON diagnostic_code_definitions(manufacturer_id);
CREATE INDEX idx_diagnostic_codes_code ON diagnostic_code_definitions(code);
CREATE INDEX idx_symptom_guides_manufacturer_id ON symptom_guides(manufacturer_id);
CREATE INDEX idx_maintenance_tasks_model_id ON maintenance_tasks(tractor_model_id);
CREATE INDEX idx_service_history_model_id ON service_history(tractor_model_id);
