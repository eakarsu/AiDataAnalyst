BEGIN;
CREATE TABLE IF NOT EXISTS analyst_ai_results(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES analyst_tenants(id),
  user_id uuid NOT NULL REFERENCES analyst_users(id),
  question text NOT NULL,
  model text NOT NULL,
  provider_receipt_id text,
  result text NOT NULL,
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE analyst_ai_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON analyst_ai_results;
CREATE POLICY tenant_isolation ON analyst_ai_results
  USING(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid)
  WITH CHECK(tenant_id=nullif(current_setting('app.tenant_id',true),'')::uuid);
COMMIT;
