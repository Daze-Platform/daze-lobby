import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HotelDetailPanel } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { 
  Buildings, 
  User, 
  EnvelopeSimple, 
  Phone, 
  Bell, 
  CircleNotch,
  CheckCircle,
  Timer,
  CircleDashed,
  ArrowSquareOut,
  Trash,
  MagnifyingGlass,
  SlidersHorizontal,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { useClients, useDeleteClient, useRestoreClient, type Client } from "@/hooks/useClients";
import { useSendBlockerNotification } from "@/hooks/useSendBlockerNotification";
import { cn } from "@/lib/utils";

const phaseColors: Record<string, string> = {
  onboarding: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  reviewing: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  pilot_live: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  contracted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const phaseLabels: Record<string, string> = {
  onboarding: "Onboarding",
  reviewing: "Reviewing",
  pilot_live: "Pilot Live",
  contracted: "Contracted",
};

type PhaseFilter = "onboarding" | "reviewing" | "pilot_live" | "contracted";

export default function Clients() {
  const [showDeleted, setShowDeleted] = useState(false);
  const { data: clients, isLoading } = useClients(showDeleted);
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifyClient, setNotifyClient] = useState<Client | null>(null);
  const [deleteClientTarget, setDeleteClientTarget] = useState<Client | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilters, setPhaseFilters] = useState<Set<PhaseFilter>>(new Set());
  
  const sendNotification = useSendBlockerNotification();
  const deleteClientMutation = useDeleteClient();
  const restoreClientMutation = useRestoreClient();

  const togglePhaseFilter = (phase: PhaseFilter) => {
    setPhaseFilters((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(q);
        const matchesContact = client.primaryContact?.name?.toLowerCase().includes(q);
        const matchesCode = client.client_code?.toLowerCase().includes(q);
        if (!matchesName && !matchesContact && !matchesCode) return false;
      }
      // Phase filter
      if (phaseFilters.size > 0 && !phaseFilters.has(client.phase as PhaseFilter)) {
        return false;
      }
      return true;
    });
  }, [clients, searchQuery, phaseFilters]);

  const activeFilterCount = phaseFilters.size;

  const handleClientClick = (client: Client) => {
    if (showDeleted) return; // Don't open detail panel for deleted clients
    setSelectedClient(client);
    setIsPanelOpen(true);
  };

  const handleNotifyClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation();
    setNotifyClient(client);
  };

  const handleSendNotification = () => {
    if (!notifyClient) return;
    sendNotification.mutate({
      clientId: notifyClient.id,
      blockerReason: "Action required on your onboarding tasks",
      message: "Please review and complete your pending onboarding tasks to proceed.",
    }, {
      onSettled: () => setNotifyClient(null),
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {showDeleted ? "Deleted Clients" : "Clients"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {showDeleted ? "Recently deleted clients that can be restored" : "Manage all client properties"}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge variant="secondary" className="gap-1.5">
              <User size={14} weight="duotone" />
              {isLoading ? "..." : `${filteredClients.length} Total`}
            </Badge>
            <Button
              variant={showDeleted ? "destructive" : "outline"}
              size="sm"
              className="gap-1.5 text-xs h-7"
              onClick={() => setShowDeleted(!showDeleted)}
            >
              <Trash size={14} weight="duotone" />
              Recently Deleted
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={16} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, contact, or client code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <SlidersHorizontal size={16} weight="duotone" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Phase</DropdownMenuLabel>
              {(Object.entries(phaseLabels) as [PhaseFilter, string][]).map(([key, label]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={phaseFilters.has(key)}
                  onCheckedChange={() => togglePhaseFilter(key)}
                >
                  <Badge className={cn("mr-2 text-2xs", phaseColors[key])}>
                    {label}
                  </Badge>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client List */}
        <div className="grid gap-3 sm:gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredClients.length === 0 ? (
            <Card className="py-12 sm:py-16">
              <div className="flex flex-col items-center justify-center text-center px-4">
                <CircleDashed 
                  size={64} 
                  weight="duotone" 
                  className="text-orange-400 animate-pulse"
                  style={{ '--ph-duotone-opacity': 0.2 } as React.CSSProperties}
                />
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {searchQuery || phaseFilters.size > 0
                    ? "No clients match your filters"
                    : showDeleted
                      ? "No deleted clients"
                      : "No clients yet"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  {searchQuery || phaseFilters.size > 0
                    ? "Try adjusting your search or filters."
                    : showDeleted
                      ? "Deleted clients will appear here for recovery."
                      : "Add your first client to get started with the onboarding process."}
                </p>
              </div>
            </Card>
          ) : (
            filteredClients.map((client) => {
              const isContracted = client.phase === "contracted";
              const isPending = client.phase === "onboarding" || client.phase === "reviewing";
              const isDeleted = !!client.deleted_at;
              const daysRemaining = isDeleted
                ? Math.max(0, 30 - Math.floor((Date.now() - new Date(client.deleted_at!).getTime()) / (1000 * 60 * 60 * 24)))
                : 0;

              return (
                <Card 
                  key={client.id} 
                  className={cn(
                    "transition-all group",
                    isDeleted
                      ? "opacity-70 border-dashed"
                      : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  )}
                  onClick={() => handleClientClick(client)}
                >
                  <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Buildings size={20} weight="duotone" className="text-primary shrink-0" />
                        <span className={cn("truncate", isDeleted && "line-through text-muted-foreground")}>{client.name}</span>
                        {client.client_slug === "daze-downtown-hotel" && (
                          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-2xs font-medium px-1.5 py-0">
                            Test
                          </Badge>
                        )}
                        {!isDeleted && isContracted && (
                          <CheckCircle size={16} weight="duotone" className="text-emerald-500 shrink-0" />
                        )}
                        {!isDeleted && isPending && (
                          <Timer size={16} weight="duotone" className="text-orange-500 shrink-0" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {isDeleted ? (
                          /* Restore button + days remaining for deleted clients */
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-2xs font-medium",
                              daysRemaining <= 7 ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                restoreClientMutation.mutate(client.id);
                                supabase.from("activity_logs").insert([{
                                  client_id: client.id,
                                  action: "client_restored",
                                  details: { client_name: client.name } as unknown as Json,
                                  is_auto_logged: false,
                                }]);
                              }}
                              disabled={restoreClientMutation.isPending}
                            >
                              {restoreClientMutation.isPending ? (
                                <CircleNotch size={14} weight="bold" className="animate-spin" />
                              ) : (
                                <ArrowCounterClockwise size={14} weight="duotone" />
                              )}
                              Restore
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* View Portal Button */}
                            {client.client_slug && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/admin/portal/${client.client_slug}`);
                                      }}
                                    >
                                      <ArrowSquareOut size={16} weight="duotone" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>View portal</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {/* Delete Button */}
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteClientTarget(client);
                                    }}
                                  >
                                    <Trash size={16} weight="duotone" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top"><p>Delete client</p></TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            {/* Notify Button */}
                            {client.incompleteCount > 0 && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-8 w-8",
                                        client.hasRecentReminder
                                          ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                          : "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                      )}
                                      onClick={(e) => handleNotifyClick(e, client)}
                                    >
                                      <Bell size={16} weight="duotone" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>{client.hasRecentReminder ? "Reminder already sent" : "Send reminder to client"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </>
                        )}
                        <Badge className={phaseColors[client.phase] || phaseColors.onboarding}>
                          {client.phase.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      {client.primaryContact ? (
                        <>
                          <div className="flex items-center gap-2">
                            <User size={14} weight="duotone" className="shrink-0" />
                            <span className="truncate">{client.primaryContact.name}</span>
                          </div>
                          {client.primaryContact.email && (
                            <div className="flex items-center gap-2">
                              <EnvelopeSimple size={14} weight="duotone" className="shrink-0" />
                              <span className="truncate">{client.primaryContact.email}</span>
                            </div>
                          )}
                          {client.primaryContact.phone && (
                            <div className="hidden sm:flex items-center gap-2">
                              <Phone size={14} weight="duotone" className="shrink-0" />
                              <span>{client.primaryContact.phone}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground/60 italic">No primary contact</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Client Detail Panel */}
      <HotelDetailPanel
        hotel={selectedClient}
        open={isPanelOpen}
        onOpenChange={setIsPanelOpen}
      />

      {/* Notification Confirmation Dialog */}
      <AlertDialog open={!!notifyClient} onOpenChange={(open) => !open && setNotifyClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notify {notifyClient?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a notification to the client's activity feed, alerting them to review and complete their pending onboarding tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendNotification}
              disabled={sendNotification.isPending}
              className="gap-2"
            >
              {sendNotification.isPending && <CircleNotch size={16} weight="bold" className="animate-spin" />}
              Send Notification
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteClientTarget} onOpenChange={(open) => !open && setDeleteClientTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteClientTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This client will be moved to the deleted list. You can restore it later from the "Recently Deleted" filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteClientTarget) {
                  deleteClientMutation.mutate(deleteClientTarget.id, {
                    onSettled: () => setDeleteClientTarget(null),
                  });
                  // Log activity
                  supabase.from("activity_logs").insert([{
                    client_id: deleteClientTarget.id,
                    action: "client_deleted",
                    details: { client_name: deleteClientTarget.name } as unknown as Json,
                    is_auto_logged: false,
                  }]);
                }
              }}
              disabled={deleteClientMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteClientMutation.isPending && <CircleNotch size={16} weight="bold" className="animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
