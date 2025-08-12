// schema.js
import { readFileSync } from 'fs';

export async function initDatabase(client) {
  const ddl = `
  -- Enable UUID generator
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'form_type_enum') THEN
      CREATE TYPE form_type_enum AS ENUM ('form1', 'form2', 'form3');
    END IF;
  END$$;

  CREATE TABLE IF NOT EXISTS assessment (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS form_submission (
    submission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessment(assessment_id) ON DELETE CASCADE,
    form_type form_type_enum NOT NULL,
    action_type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assessment_id, form_type)
  );

  CREATE INDEX IF NOT EXISTS idx_form_submission_data_gin ON form_submission USING GIN (data);

  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at := now();
    RETURN NEW;
  END$$;

  DROP TRIGGER IF EXISTS trg_assessment_updated ON assessment;
  CREATE TRIGGER trg_assessment_updated BEFORE UPDATE ON assessment
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  DROP TRIGGER IF EXISTS trg_form_submission_updated ON form_submission;
  CREATE TRIGGER trg_form_submission_updated BEFORE UPDATE ON form_submission
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

  CREATE OR REPLACE FUNCTION create_assessment()
  RETURNS UUID LANGUAGE plpgsql AS $$
  DECLARE
    new_id UUID;
  BEGIN
    INSERT INTO assessment DEFAULT VALUES
    RETURNING assessment_id INTO new_id;
    RETURN new_id;
  END$$;

  CREATE OR REPLACE FUNCTION upsert_form_submission(
    p_assessment_id UUID,
    p_form_type form_type_enum,
    p_action_type TEXT,
    p_data JSONB
  )
  RETURNS TABLE (submission_id UUID, assessment_id UUID)
  LANGUAGE plpgsql AS $$
  DECLARE
    v_assessment_id UUID;
    v_submission_id UUID;
  BEGIN
    IF p_assessment_id IS NULL THEN
      v_assessment_id := create_assessment();
    ELSE
      SELECT a.assessment_id INTO v_assessment_id
      FROM assessment a WHERE a.assessment_id = p_assessment_id;
      IF v_assessment_id IS NULL THEN
        INSERT INTO assessment(assessment_id) VALUES (p_assessment_id);
        v_assessment_id := p_assessment_id;
      END IF;
    END IF;

    INSERT INTO form_submission (assessment_id, form_type, action_type, data)
    VALUES (v_assessment_id, p_form_type, p_action_type, p_data)
    ON CONFLICT (assessment_id, form_type)
    DO UPDATE SET
      action_type = EXCLUDED.action_type,
      data = EXCLUDED.data,
      updated_at = now()
    RETURNING submission_id INTO v_submission_id;

    UPDATE assessment SET updated_at = now() WHERE assessment_id = v_assessment_id;

    RETURN QUERY SELECT v_submission_id, v_assessment_id;
  END$$;

  CREATE OR REPLACE FUNCTION finalize_assessment(p_assessment_id UUID)
  RETURNS VOID LANGUAGE sql AS $$
    UPDATE assessment SET status = 'complete', updated_at = now()
    WHERE assessment_id = p_assessment_id;
  $$;
  `;

  await client.query(ddl);
}



