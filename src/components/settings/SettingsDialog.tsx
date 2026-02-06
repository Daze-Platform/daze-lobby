import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Database, RefreshCw, Trash2 } from "lucide-react";
import { usePurgeAndReseed } from "@/hooks/usePurgeAndReseed";
import { useAuthContext } from "@/contexts/AuthContext";
import { isTestEnvironment } from "@/lib/environment";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const { purgeAndReseed, isPurging } = usePurgeAndReseed();
  const { role } = useAuthContext();

  const isAdmin = role === "admin";
  const isTest = isTestEnvironment();

  const handlePurgeAndReseed = async () => {
    setShowPurgeConfirm(false);
    await purgeAndReseed();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your dashboard preferences and data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Data Management Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Data Management</h3>
                {isTest && (
                  <Badge variant="outline" className="text-2xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Test Only
                  </Badge>
                )}
              </div>

              <Separator />

              {isTest ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Reset the database with fresh demo data. This will delete all existing hotels, contacts, devices, and alerts.
                  </p>

                  {isAdmin ? (
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => setShowPurgeConfirm(true)}
                      disabled={isPurging}
                    >
                      {isPurging ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Reseeding...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Purge & Reseed Data
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-sm text-muted-foreground">
                        Only admins can purge and reseed data.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm text-muted-foreground">
                    Data management tools are only available in test environments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showPurgeConfirm} onOpenChange={setShowPurgeConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Purge & Reseed
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete ALL hotels and their associated data</li>
                <li>Remove all contacts, devices, and alerts</li>
                <li>Generate 10 new demo hotels across all phases</li>
              </ul>
              <p className="font-medium text-foreground pt-2">
                This cannot be undone. Continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurgeAndReseed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Purge & Reseed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
