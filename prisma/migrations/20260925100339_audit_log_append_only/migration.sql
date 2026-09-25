-- CreateIndex
CREATE INDEX "audit_log_action_createdAt_idx" ON "audit_log"("action", "createdAt");

-- Integrity rules the Prisma schema cannot express (hand-written).
-- Actions are dotted keys from src/lib/audit/actions.ts, e.g. "event.guest-limit".
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_action_check"
  CHECK ("action" ~ '^[a-z]+(\.[a-z]+(-[a-z]+)*)+$');
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_target_type_check"
  CHECK ("targetType" IN ('event', 'user'));

-- The audit log is append-only: entries can be added, never changed or removed. The one change
-- allowed is the "actorId" → NULL that deleting a user makes (ON DELETE SET NULL), so entries
-- outlive their author. TRUNCATE (the integration tests' reset) fires no row triggers.
CREATE FUNCTION "audit_log_append_only"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE'
    AND OLD."actorId" IS NOT NULL AND NEW."actorId" IS NULL
    AND (NEW."id", NEW."action", NEW."targetType", NEW."targetId", NEW."metadata", NEW."createdAt")
      IS NOT DISTINCT FROM
      (OLD."id", OLD."action", OLD."targetType", OLD."targetId", OLD."metadata", OLD."createdAt")
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only: % refused', TG_OP;
END;
$$;

CREATE TRIGGER "audit_log_append_only"
  BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION "audit_log_append_only"();
