import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HotelDetailPanel } from "@/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
} from "@phosphor-icons/react";
import { useClients, type Client } from "@/hooks/useClients";
import { useSendBlockerNotification } from "@/hooks/useSendBlockerNotification";
import { cn } from "@/lib/utils";

const phaseColors: Record<string, string> = {
  onboarding: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  reviewing: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  pilot_live: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  contracted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [notifyClient, setNotifyClient] = useState<Client | null>(null);
  
  const sendNotification = useSendBlockerNotification();

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsPanelOpen(true);
  };

  const handleNotifyClick = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation(); // Prevent card click
    setNotifyClient(client);
  };

  const handleSendNotification = () => {
    if (!notifyClient) return;
    
    sendNotification.mutate({
      clientId: notifyClient.id,
      blockerReason: "Action required on your onboarding tasks",
      message: "Please review and complete your pending onboarding tasks to proceed.",
    }, {
      onSettled: () => {
        setNotifyClient(null);
      }
    });
  };


  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Responsive header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Clients</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage all client properties</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto">
            <User size={14} weight="duotone" />
            {isLoading ? "..." : `${clients?.length ?? 0} Total`}
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {isLoading ? (
            // Loading skeletons
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
          ) : (
            clients?.length === 0 ? (
              // Empty state
              <Card className="py-12 sm:py-16">
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <div className="relative">
                    <CircleDashed 
                      size={64} 
                      weight="duotone" 
                      className="text-orange-400 animate-pulse"
                      style={{ 
                        '--ph-duotone-opacity': 0.2 
                      } as React.CSSProperties}
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No clients yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Add your first client to get started with the onboarding process.
                  </p>
                </div>
              </Card>
            ) : (
              clients?.map((client) => {
                const isContracted = client.phase === "contracted";
                const isPending = client.phase === "onboarding" || client.phase === "reviewing";

                return (
                  <Card 
                    key={client.id} 
                    className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                    onClick={() => handleClientClick(client)}
                  >
                    <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Buildings size={20} weight="duotone" className="text-primary shrink-0" />
                          <span className="truncate">{client.name}</span>
                          {/* Status icon */}
                          {isContracted ? (
                            <CheckCircle size={16} weight="duotone" className="text-emerald-500 shrink-0" />
                          ) : isPending ? (
                            <Timer size={16} weight="duotone" className="text-orange-500 shrink-0" />
                          ) : null}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {/* Notify Button - Only show when there are pending tasks */}
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
                          <Badge className={phaseColors[client.phase] || phaseColors.onboarding}>
                            {client.phase.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        {client.primaryContact && (
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
                        )}
                        {!client.primaryContact && (
                          <span className="text-muted-foreground/60 italic">No primary contact</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )
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
    </DashboardLayout>
  );
}
