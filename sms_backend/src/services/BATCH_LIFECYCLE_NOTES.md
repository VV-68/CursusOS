# Batch Lifecycle Compatibility Notes

This transition keeps existing tables/routes working while introducing batch-wise progression.

## Core Compatibility Decisions

- `classes` is now treated as a permanent **batch** entity.
- Legacy fields like `classes.semester_id`, `departments.active_term`, and `semesters.is_active` are retained for compatibility and fallback.
- `student_academic_history` is the primary source of current academic state (`is_active = true` latest row).

## New Workflow Tables

- `batch_promotion_requests`
- `batch_deactivation_requests`

Both are additive and non-destructive.

## Progression Flow

1. HOD creates promotion request (`pending`).
2. Admin reviews request (`approved/rejected`).
3. On approval:
   - old `student_academic_history` rows are deactivated, not overwritten
   - new active rows are inserted
   - batch semester/year fields are advanced
   - course assignments can be copied to target semester context

## Login Gating

- Student login and JWT verification now validate active academic/batch state.
- Inactive/graduated batch students are denied access with clear message.

## Rollout

Run the SQL migration file first:

- `src/db/migrate_batch_lifecycle_safe.sql`

No drops, no truncation, no destructive updates are performed.
