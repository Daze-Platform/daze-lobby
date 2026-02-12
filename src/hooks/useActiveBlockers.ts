import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveBlocker {
  id: string;
  clientId: string;
  clientName: string;
  reason: string;
  blockerType: "manual" | "automatic";
  autoRule: string | null;
  createdAt: string;
  completedTasks: number;
  totalTasks: number;
  /** The task_key of the first incomplete task, if any */
  incompleteTaskKey: string | null;
  clientSlug: string | null;
}

/** Returns true if this blocker was created by the inactivity watchdog */
export function isWatchdogBlocker(blocker: ActiveBlocker): boolean {
  return blocker.blockerType === "automatic" && (blocker.autoRule?.startsWith("inactivity_watchdog") ?? false);
}

/** Extracts severity ('medium' | 'high') from a watchdog blocker's auto_rule */
export function getWatchdogSeverity(blocker: ActiveBlocker): "medium" | "high" {
  if (blocker.autoRule?.includes(":high")) return "high";
  return "medium";
}

/**
 * Runs the inactivity watchdog RPC to auto-create blockers for stale tasks.
 * Call on dashboard mount to ensure the blocker list is fresh.
 */
export async function refreshInactivityBlockers() {
  const { error } = await supabase.rpc("check_client_inactivity");
  if (error) console.error("[Watchdog] Failed to refresh inactivity blockers:", error);
}

export function useActiveBlockers() {
  return useQuery({
    queryKey: ["active-blockers"],
    queryFn: async () => {
      // Run watchdog check before fetching
      await refreshInactivityBlockers();

      // Fetch unresolved blockers with client name
      const { data: blockers, error: blockersError } = await supabase
        .from("blocker_alerts")
        .select("id, client_id, reason, blocker_type, auto_rule, created_at, clients(name, client_slug)")
        .is("resolved_at", null)
        .order("created_at", { ascending: false });

      if (blockersError) throw blockersError;
      if (!blockers || blockers.length === 0) return [] as ActiveBlocker[];

      // Get unique client IDs
      const clientIds = [...new Set(blockers.map((b) => b.client_id))];

      // Fetch onboarding tasks for those clients
      const { data: tasks, error: tasksError } = await supabase
        .from("onboarding_tasks")
        .select("client_id, task_key, is_completed")
        .in("client_id", clientIds);

      if (tasksError) throw tasksError;

      // Build per-client task stats
      const taskStats = new Map<string, { completed: number; total: number; firstIncompleteKey: string | null }>();
      for (const cid of clientIds) {
        const clientTasks = (tasks || []).filter((t) => t.client_id === cid);
        const completed = clientTasks.filter((t) => t.is_completed).length;
        const firstIncomplete = clientTasks.find((t) => !t.is_completed);
        taskStats.set(cid, {
          completed,
          total: clientTasks.length,
          firstIncompleteKey: firstIncomplete?.task_key ?? null,
        });
      }

      return blockers.map((b): ActiveBlocker => {
        const stats = taskStats.get(b.client_id) || { completed: 0, total: 5, firstIncompleteKey: null };
        const clientObj = b.clients as unknown as { name: string; client_slug: string | null } | null;
        return {
          id: b.id,
          clientId: b.client_id,
          clientName: clientObj?.name ?? "Unknown Client",
          reason: b.reason,
          blockerType: b.blocker_type,
          autoRule: b.auto_rule,
          createdAt: b.created_at,
          completedTasks: stats.completed,
          totalTasks: stats.total || 5,
          incompleteTaskKey: stats.firstIncompleteKey,
          clientSlug: clientObj?.client_slug ?? null,
        };
      });
    },
  });
}
