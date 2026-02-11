// Raw source imports for code review (bundled at build time via Vite ?raw)
import useClients from "@/hooks/useClients?raw";
import useDevices from "@/hooks/useDevices?raw";
import useMessages from "@/hooks/useMessages?raw";
import useAuth from "@/hooks/useAuth?raw";
import useActiveBlockers from "@/hooks/useActiveBlockers?raw";
import useClientPortal from "@/hooks/useClientPortal?raw";
import useLogActivity from "@/hooks/useLogActivity?raw";
import useFormattedTasks from "@/hooks/useFormattedTasks?raw";

import Dashboard from "@/pages/Dashboard?raw";
import Clients from "@/pages/Clients?raw";
import Devices from "@/pages/Devices?raw";
import Blockers from "@/pages/Blockers?raw";
import Portal from "@/pages/Portal?raw";
import Auth from "@/pages/Auth?raw";

import KanbanBoard from "@/components/kanban/KanbanBoard?raw";
import ActivityFeedPanel from "@/components/portal/ActivityFeedPanel?raw";
import NewClientModal from "@/components/modals/NewClientModal?raw";
import ClientDetailPanel from "@/components/dashboard/ClientDetailPanel?raw";

import AuthContext from "@/contexts/AuthContext?raw";
import ClientContext from "@/contexts/ClientContext?raw";
import VenueContext from "@/contexts/VenueContext?raw";

import clientTypes from "@/types/client?raw";
import authTypes from "@/types/auth?raw";
import taskTypes from "@/types/task?raw";
import venueTypes from "@/types/venue?raw";

import authLib from "@/lib/auth?raw";
import utils from "@/lib/utils?raw";
import fileValidation from "@/lib/fileValidation?raw";

import AppFile from "@/App?raw";

export interface ReviewFile {
  path: string;
  content: string;
}

export const filesToReview: ReviewFile[] = [
  // Hooks
  { path: "src/hooks/useClients.ts", content: useClients },
  { path: "src/hooks/useDevices.ts", content: useDevices },
  { path: "src/hooks/useMessages.ts", content: useMessages },
  { path: "src/hooks/useAuth.ts", content: useAuth },
  { path: "src/hooks/useActiveBlockers.ts", content: useActiveBlockers },
  { path: "src/hooks/useClientPortal.ts", content: useClientPortal },
  { path: "src/hooks/useLogActivity.ts", content: useLogActivity },
  { path: "src/hooks/useFormattedTasks.ts", content: useFormattedTasks },

  // Pages
  { path: "src/pages/Dashboard.tsx", content: Dashboard },
  { path: "src/pages/Clients.tsx", content: Clients },
  { path: "src/pages/Devices.tsx", content: Devices },
  { path: "src/pages/Blockers.tsx", content: Blockers },
  { path: "src/pages/Portal.tsx", content: Portal },
  { path: "src/pages/Auth.tsx", content: Auth },

  // Key components
  { path: "src/components/kanban/KanbanBoard.tsx", content: KanbanBoard },
  { path: "src/components/portal/ActivityFeedPanel.tsx", content: ActivityFeedPanel },
  { path: "src/components/modals/NewClientModal.tsx", content: NewClientModal },
  { path: "src/components/dashboard/ClientDetailPanel.tsx", content: ClientDetailPanel },

  // Contexts
  { path: "src/contexts/AuthContext.tsx", content: AuthContext },
  { path: "src/contexts/ClientContext.tsx", content: ClientContext },
  { path: "src/contexts/VenueContext.tsx", content: VenueContext },

  // Types
  { path: "src/types/client.ts", content: clientTypes },
  { path: "src/types/auth.ts", content: authTypes },
  { path: "src/types/task.ts", content: taskTypes },
  { path: "src/types/venue.ts", content: venueTypes },

  // Utilities
  { path: "src/lib/auth.ts", content: authLib },
  { path: "src/lib/utils.ts", content: utils },
  { path: "src/lib/fileValidation.ts", content: fileValidation },

  // App root
  { path: "src/App.tsx", content: AppFile },
];
