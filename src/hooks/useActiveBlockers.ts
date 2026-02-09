import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveBlocker {
  id: string;
  clientId: string;
  clientName: string;
  reason: string;
  blockerType: "manual" | "automatic";
  createdAt: string;
  completedTasks: number;
  totalTasks: number;
  /** The task_key of the first incomplete task, if any */
  incompleteTaskKey: string | null;
}

export function useActiveBlockers() {
  return useQuery({
    queryKey: ["active-blockers"],
    queryFn: async () => {
      // Fetch unresolved blockers with client name
      const { data: blockers, error: blockersError } = await supabase
        .from("blocker_alerts")
        .select("id, client_id, reason, blocker_type, created_at, clients(name)")
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
        // clients is returned as an object (single FK relation)
        const clientObj = b.clients as unknown as { name: string } | null;
        return {
          id: b.id,
          clientId: b.client_id,
          clientName: clientObj?.name ?? "Unknown Client",
          reason: b.reason,
          blockerType: b.blocker_type,
          createdAt: b.created_at,
          completedTasks: stats.completed,
          totalTasks: stats.total || 5,
          incompleteTaskKey: stats.firstIncompleteKey,
        };
      });
    },
  });
}
