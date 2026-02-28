/**
 * src/db/index.ts
 * Barrel export — import anything DB-related from '@db'
 *
 * @example
 *   import { query, execute, checkEligibility } from '@db';
 *   import type { ApplicantRow, ScholarshipRow }  from '@db';
 */

export * from "./connection";
export * from "./types";
export * from "./eligibility";
export * from "./requirements-config";
