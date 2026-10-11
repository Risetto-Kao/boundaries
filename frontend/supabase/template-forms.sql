-- Additive schema for template/form separation. Run once, with explicit
-- database rollout authorization. Existing legacy tables and rows are untouched.
BEGIN;

-- CreateTable
CREATE TABLE "boundary_templates" (
    "id" TEXT NOT NULL,
    "owner_type" VARCHAR(10) NOT NULL DEFAULT 'USER',
    "owner_id" UUID,
    "author_name" VARCHAR(200),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "source_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "boundary_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_template_questions" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "boundary_template_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_forms" (
    "id" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "source_id" TEXT,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "invite_hash" VARCHAR(64) NOT NULL,
    "invite_encrypted" TEXT NOT NULL,
    "access_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boundary_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_form_questions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "boundary_form_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_guest_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boundary_guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_submissions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "user_id" UUID,
    "guest_session_id" TEXT,
    "nickname" VARCHAR(50) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "payload_hash" VARCHAR(64) NOT NULL,
    "access_version" INTEGER NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boundary_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boundary_submission_answers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" VARCHAR(10) NOT NULL,

    CONSTRAINT "boundary_submission_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boundary_templates_owner_id_created_at_idx" ON "boundary_templates"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_template_questions_template_id_order_index_key" ON "boundary_template_questions"("template_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_forms_invite_hash_key" ON "boundary_forms"("invite_hash");

-- CreateIndex
CREATE INDEX "boundary_forms_owner_id_created_at_idx" ON "boundary_forms"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_form_questions_form_id_order_index_key" ON "boundary_form_questions"("form_id", "order_index");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_guest_sessions_token_hash_key" ON "boundary_guest_sessions"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_submissions_request_hash_key" ON "boundary_submissions"("request_hash");

-- CreateIndex
CREATE INDEX "boundary_submissions_user_id_submitted_at_idx" ON "boundary_submissions"("user_id", "submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_submissions_form_id_user_id_key" ON "boundary_submissions"("form_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_submissions_form_id_guest_session_id_key" ON "boundary_submissions"("form_id", "guest_session_id");

-- CreateIndex
CREATE INDEX "boundary_submission_answers_question_id_idx" ON "boundary_submission_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "boundary_submission_answers_submission_id_question_id_key" ON "boundary_submission_answers"("submission_id", "question_id");

-- AddForeignKey
ALTER TABLE "boundary_templates" ADD CONSTRAINT "boundary_templates_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "boundary_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_template_questions" ADD CONSTRAINT "boundary_template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "boundary_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_forms" ADD CONSTRAINT "boundary_forms_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "boundary_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_form_questions" ADD CONSTRAINT "boundary_form_questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "boundary_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_submissions" ADD CONSTRAINT "boundary_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "boundary_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_submissions" ADD CONSTRAINT "boundary_submissions_guest_session_id_fkey" FOREIGN KEY ("guest_session_id") REFERENCES "boundary_guest_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_submission_answers" ADD CONSTRAINT "boundary_submission_answers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "boundary_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boundary_submission_answers" ADD CONSTRAINT "boundary_submission_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "boundary_form_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE boundary_templates ADD CONSTRAINT boundary_template_owner CHECK (
  (owner_type = 'OFFICIAL' AND owner_id IS NULL) OR
  (owner_type = 'USER' AND owner_id IS NOT NULL)
);
ALTER TABLE boundary_templates ADD CONSTRAINT boundary_templates_auth_owner
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE boundary_forms ADD CONSTRAINT boundary_forms_auth_owner
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE boundary_submissions ADD CONSTRAINT boundary_submissions_auth_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE boundary_submissions ADD CONSTRAINT boundary_submission_identity CHECK (
  (user_id IS NOT NULL)::int + (guest_session_id IS NOT NULL)::int = 1
);
ALTER TABLE boundary_submission_answers ADD CONSTRAINT boundary_answer_value CHECK (value IN ('yes', 'no', 'depends'));
ALTER TABLE boundary_forms ADD CONSTRAINT boundary_form_version CHECK (access_version > 0);
ALTER TABLE boundary_submissions ADD CONSTRAINT boundary_submission_version CHECK (access_version > 0);
ALTER TABLE boundary_templates ADD CONSTRAINT boundary_template_title CHECK (length(btrim(title)) > 0);
ALTER TABLE boundary_forms ADD CONSTRAINT boundary_form_title CHECK (length(btrim(title)) > 0);
ALTER TABLE boundary_template_questions ADD CONSTRAINT boundary_template_question CHECK (order_index BETWEEN 1 AND 20 AND length(btrim(text)) > 0);
ALTER TABLE boundary_form_questions ADD CONSTRAINT boundary_form_question CHECK (order_index BETWEEN 1 AND 20 AND length(btrim(text)) > 0);

-- Snapshots are written in their parent creation transaction only. Cascading
-- deletion of an entire form remains permitted; editing its questions does not.
CREATE FUNCTION boundary_guard_form_question() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (SELECT 1 FROM boundary_forms WHERE id = NEW.form_id AND xmin::text = pg_current_xact_id()::text) THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM boundary_forms WHERE id = OLD.form_id) THEN RETURN OLD; END IF;
  END IF;
  RAISE EXCEPTION 'Form questions are immutable' USING ERRCODE = '23514';
END $$;
CREATE TRIGGER boundary_form_questions_immutable BEFORE INSERT OR UPDATE OR DELETE ON boundary_form_questions FOR EACH ROW EXECUTE FUNCTION boundary_guard_form_question();

CREATE FUNCTION boundary_guard_submission_answer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM boundary_submissions s JOIN boundary_form_questions q ON q.form_id = s.form_id
      WHERE s.id = NEW.submission_id AND q.id = NEW.question_id AND s.xmin::text = pg_current_xact_id()::text
    ) THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM boundary_submissions WHERE id = OLD.submission_id) THEN RETURN OLD; END IF;
  END IF;
  RAISE EXCEPTION 'Submitted answers are immutable and must belong to the form' USING ERRCODE = '23514';
END $$;
CREATE TRIGGER boundary_submission_answers_immutable BEFORE INSERT OR UPDATE OR DELETE ON boundary_submission_answers FOR EACH ROW EXECUTE FUNCTION boundary_guard_submission_answer();

CREATE FUNCTION boundary_check_complete_submission() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expected integer; actual integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM boundary_submissions WHERE id = NEW.id) THEN RETURN NULL; END IF;
  SELECT count(*) INTO expected FROM boundary_form_questions WHERE form_id = NEW.form_id;
  SELECT count(*) INTO actual FROM boundary_submission_answers WHERE submission_id = NEW.id;
  IF expected < 1 OR actual <> expected THEN RAISE EXCEPTION 'A submission must answer every question' USING ERRCODE = '23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER boundary_submission_complete AFTER INSERT ON boundary_submissions
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION boundary_check_complete_submission();

CREATE FUNCTION boundary_guard_submission() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (to_jsonb(NEW) - 'access_version') IS DISTINCT FROM (to_jsonb(OLD) - 'access_version') THEN
    RAISE EXCEPTION 'Completed submissions are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER boundary_submissions_immutable BEFORE UPDATE ON boundary_submissions FOR EACH ROW EXECUTE FUNCTION boundary_guard_submission();

-- Browser Supabase roles never access these tables directly. All reads, including
-- public templates, go through Next.js; private results require server checks.
ALTER TABLE boundary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_submission_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON boundary_templates, boundary_template_questions, boundary_forms,
  boundary_form_questions, boundary_guest_sessions, boundary_submissions,
  boundary_submission_answers FROM anon, authenticated;
COMMIT;
