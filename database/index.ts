/**
 * src/db/index.ts
 * Barrel export — import anything DB-related from '@db'
 *
 * @example
 *   import { query, execute, checkEligibility } from '@db';
 *   import type { ApplicantRow, ApplicationRow }  from '@db';
 */

export * from "./connection";
export * from "./types";
export * from "./eligibility";
