/**
 * Onboarding task type definitions
 * Centralized types for task/checklist data models
 */

/**
 * Onboarding task from database
 */
export interface OnboardingTask {
  id: string;
  client_id: string;
  task_key: string;
  task_name: string;
  is_completed: boolean;
  completed_at: string | null;
  data: Record<string, unknown>;
}

/**
 * Task keys used in the onboarding flow
 */
export type TaskKey = "brand" | "venue" | "pos" | "devices" | "legal";

/**
 * Formatted task for UI consumption
 * Used by TaskAccordion component
 */
export interface FormattedTask {
  key: string;
  name: string;
  isCompleted: boolean;
  data: Record<string, unknown>;
}

/**
 * Default tasks when no tasks exist in database
 */
export const DEFAULT_TASKS: FormattedTask[] = [
  { key: "brand", name: "Brand Identity", isCompleted: false, data: {} },
  { key: "venue", name: "Venue Manager", isCompleted: false, data: {} },
  { key: "pos", name: "POS Integration", isCompleted: false, data: {} },
  { key: "devices", name: "Device Setup", isCompleted: false, data: {} },
  { key: "legal", name: "Legal & Agreements", isCompleted: false, data: {} },
];
