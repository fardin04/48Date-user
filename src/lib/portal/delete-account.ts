import type { DeleteAccountData } from "@/lib/api/types/users";

/**
 * Phase 32: Account Deletion pure logic.
 * Enforces button gating, validation before submit, and handles deletion response parsing.
 */

/** The destructive deletion submit is enabled only after confirmation is explicitly checked and not busy. */
export function canSubmitDeletion(understood: boolean, busy: boolean): boolean {
  return understood && !busy;
}

/** Parses the deletion response data, verifying purge scheduling and calculating days remaining. */
export function parseDeletionSchedule(data: DeleteAccountData, now = Date.now()): {
  isPurgeScheduled: boolean;
  purgeDate: Date;
  daysRemaining: number;
} {
  const purgeDate = new Date(data.purgeAt);
  const diffMs = purgeDate.getTime() - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return {
    isPurgeScheduled: Boolean(data.deleted),
    purgeDate,
    daysRemaining,
  };
}
