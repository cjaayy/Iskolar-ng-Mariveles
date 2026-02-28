/**
 * database/index.ts
 * Barrel export — import anything DB-related from '@/database'
 *
 * @example
 *   import { query, execute, checkEligibility } from '@/database';
 *   import type { ApplicantRow, ScholarshipRow }  from '@/database';
 */

export * from "./connection";
export * from "./types";
export * from "./eligibility";
export * from "./requirements-config";
