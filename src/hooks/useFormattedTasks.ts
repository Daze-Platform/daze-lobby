import { useMemo } from "react";
import type { OnboardingTask, FormattedTask } from "@/types";
import { DEFAULT_TASKS } from "@/types";

/**
 * Formats onboarding tasks for UI consumption
 * Extracts duplicated logic from Portal.tsx and PortalAdmin.tsx
 */
export function useFormattedTasks(tasks: OnboardingTask[]): FormattedTask[] {
  return useMemo(() => 
    tasks.length > 0 
      ? tasks.map(t => ({
          key: t.task_key,
          name: t.task_name,
          isCompleted: t.is_completed,
          data: t.data as Record<string, unknown>,
        }))
      : DEFAULT_TASKS,
    [tasks]
  );
}
