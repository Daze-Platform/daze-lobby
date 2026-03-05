import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Plus, Trash2, Loader2, Store, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
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

interface AdminVenuePresetsProps {
  clientId: string;
}

interface Venue {
  id: string;
  name: string;
  client_id: string;
  created_at: string;
  logo_url: string | null;
}

interface VenueMenu {
  id: string;
  venue_id: string;
  file_url: string;
  file_name: string;
  label: string;
  created_at: string;
}

export function AdminVenuePresets({ clientId }: AdminVenuePresetsProps) {
  const queryClient = useQueryClient();
  const [newVenueName, setNewVenueName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Venue | null>(null);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [uploadingLogoVenueIds, setUploadingLogoVenueIds] = useState<Set<string>>(new Set());
  const [uploadingMenuVenueIds, setUploadingMenuVenueIds] = useState<Set<string>>(new Set());
  const [deletingMenuIds, setDeletingMenuIds] = useState<Set<string>>(new Set());

  const { data: venues, isLoading } = useQuery({
    queryKey: ["admin-venues", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venues")
        .select("id, name, client_id, created_at, logo_url")
        .eq("client_id", clientId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Venue[];
    },
  });

  const venueIds = useMemo(() => (venues || []).map((venue) => venue.id), [venues]);

  const { data: venueMenus = [] } = useQuery({
    queryKey: ["admin-venue-menus", clientId, venueIds.join(",")],
    queryFn: async () => {
      if (venueIds.length === 0) return [];

      const { data, error } = await supabase
        .from("venue_menus")
        .select("id, venue_id, file_url, file_name, label, created_at")
        .in("venue_id", venueIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as VenueMenu[];
    },
    enabled: venueIds.length > 0,
  });

  const menusByVenue = useMemo(() => {
    const grouped: Record<string, VenueMenu[]> = {};

    for (const menu of venueMenus) {
      grouped[menu.venue_id] ??= [];
      grouped[menu.venue_id].push(menu);
    }

    return grouped;
  }, [venueMenus]);

  const addVenueMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("venues")
        .insert({
          client_id: clientId,
          name: name.trim(),
        })
        .select("id, name, client_id, created_at, logo_url")
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["admin-venues", clientId] });

      const previousVenues = queryClient.getQueryData<Venue[]>(["admin-venues", clientId]);

      const optimisticVenue: Venue = {
        id: `temp-${Date.now()}`,
        name: name.trim(),
        client_id: clientId,
        created_at: new Date().toISOString(),
        logo_url: null,
      };

      queryClient.setQueryData<Venue[]>(["admin-venues", clientId], (old) =>
        old ? [...old, optimisticVenue] : [optimisticVenue]
      );

      return { previousVenues };
    },
    onError: (error: Error, _name, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(["admin-venues", clientId], context.previousVenues);
      }
      toast.error(`Failed to add venue: ${error.message}`);
    },
    onSuccess: async (_data, name) => {
      setNewVenueName("");
      toast.success("Venue added");
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert([{
          client_id: clientId,
          user_id: user.id,
          action: "venue_preset_added",
          details: { venue_name: name.trim() } as unknown as Json,
          is_auto_logged: false,
        }]);
        queryClient.invalidateQueries({ queryKey: ["activity-logs", clientId] });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
  });

  const updateVenueNameMutation = useMutation({
    mutationFn: async ({ venueId, name }: { venueId: string; name: string }) => {
      const trimmedName = name.trim();
      const { error } = await supabase
        .from("venues")
        .update({ name: trimmedName })
        .eq("id", venueId);

      if (error) throw error;
      return { venueId, name: trimmedName };
    },
    onSuccess: () => {
      toast.success("Venue name updated");
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update venue name: ${error.message}`);
    },
  });

  const deleteVenueMutation = useMutation({
    mutationFn: async (venueId: string) => {
      const { error } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId);

      if (error) throw error;
    },
    onMutate: async (venueId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-venues", clientId] });

      const previousVenues = queryClient.getQueryData<Venue[]>(["admin-venues", clientId]);

      queryClient.setQueryData<Venue[]>(["admin-venues", clientId], (old) =>
        old ? old.filter((v) => v.id !== venueId) : []
      );

      return { previousVenues };
    },
    onError: (error: Error, _venueId, context) => {
      if (context?.previousVenues) {
        queryClient.setQueryData(["admin-venues", clientId], context.previousVenues);
      }
      toast.error(`Failed to delete venue: ${error.message}`);
    },
    onSuccess: async (_data, venueId) => {
      toast.success("Venue removed");
      const { data: { user } } = await supabase.auth.getUser();
      const removedVenue = venues?.find((v) => v.id === venueId);
      if (user) {
        await supabase.from("activity_logs").insert([{
          client_id: clientId,
          user_id: user.id,
          action: "venue_preset_removed",
          details: { venue_name: removedVenue?.name || "Unknown" } as unknown as Json,
          is_auto_logged: false,
        }]);
        queryClient.invalidateQueries({ queryKey: ["activity-logs", clientId] });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["admin-venue-menus", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ venueId, file }: { venueId: string; file: File }) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `venues/${venueId}/logo-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("venues")
        .update({ logo_url: publicUrl })
        .eq("id", venueId);

      if (updateError) throw updateError;
    },
    onMutate: ({ venueId }) => {
      setUploadingLogoVenueIds((prev) => new Set(prev).add(venueId));
    },
    onSuccess: () => {
      toast.success("Logo uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-venues", clientId] });
      queryClient.invalidateQueries({ queryKey: ["venues", clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload logo: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      setUploadingLogoVenueIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.venueId);
        return next;
      });
    },
  });

  const uploadMenuMutation = useMutation({
    mutationFn: async ({ venueId, file }: { venueId: string; file: File }) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `venues/${venueId}/menu-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("onboarding-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("onboarding-assets")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("venue_menus")
        .insert({
          venue_id: venueId,
          file_url: publicUrl,
          file_name: file.name,
          label: file.name,
        });

      if (insertError) throw insertError;
    },
    onMutate: ({ venueId }) => {
      setUploadingMenuVenueIds((prev) => new Set(prev).add(venueId));
    },
    onSuccess: () => {
      toast.success("Menu uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-venue-menus", clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload menu: ${error.message}`);
    },
    onSettled: (_data, _error, variables) => {
      setUploadingMenuVenueIds((prev) => {
        const next = new Set(prev);
        next.delete(variables.venueId);
        return next;
      });
    },
  });

  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: string) => {
      const { error } = await supabase
        .from("venue_menus")
        .delete()
        .eq("id", menuId);

      if (error) throw error;
    },
    onMutate: (menuId) => {
      setDeletingMenuIds((prev) => new Set(prev).add(menuId));
    },
    onSuccess: () => {
      toast.success("Menu removed");
      queryClient.invalidateQueries({ queryKey: ["admin-venue-menus", clientId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove menu: ${error.message}`);
    },
    onSettled: (_data, _error, menuId) => {
      setDeletingMenuIds((prev) => {
        const next = new Set(prev);
        next.delete(menuId);
        return next;
      });
    },
  });

  const handleAddVenue = () => {
    if (!newVenueName.trim()) return;
    addVenueMutation.mutate(newVenueName);
  };

  const handleNameCommit = (venue: Venue) => {
    const editedName = (editingNames[venue.id] ?? venue.name).trim();
    if (!editedName || editedName === venue.name.trim()) return;
    updateVenueNameMutation.mutate({ venueId: venue.id, name: editedName });
  };

  const handleLogoFile = async (venueId: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file for venue logo");
      return;
    }
    uploadLogoMutation.mutate({ venueId, file });
  };

  const handleMenuFile = async (venueId: string, file?: File) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please upload a PDF menu file");
      return;
    }
    uploadMenuMutation.mutate({ venueId, file });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Venue Presets
        </CardTitle>
        <CardDescription className="text-xs">
          Pre-add venues and upload logos + menus for the client
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newVenueName}
            onChange={(e) => setNewVenueName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddVenue();
              }
            }}
            placeholder="e.g., Pool Deck, Beachside Bar"
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAddVenue}
            disabled={!newVenueName.trim() || addVenueMutation.isPending}
          >
            {addVenueMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : venues && venues.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {venues.map((venue) => {
                const venueMenusList = menusByVenue[venue.id] || [];
                const displayName = editingNames[venue.id] ?? venue.name;
                const isUploadingLogo = uploadingLogoVenueIds.has(venue.id);
                const isUploadingMenu = uploadingMenuVenueIds.has(venue.id);

                return (
                  <motion.div
                    key={venue.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Card className="border-border/60">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10 border">
                              <AvatarImage src={venue.logo_url || undefined} alt={`${venue.name} logo`} />
                              <AvatarFallback>
                                <Store className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <Input
                              value={displayName}
                              onChange={(e) => {
                                const value = e.target.value;
                                setEditingNames((prev) => ({ ...prev, [venue.id]: value }));
                              }}
                              onBlur={() => handleNameCommit(venue)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleNameCommit(venue);
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="h-9"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(venue)}
                            disabled={deleteVenueMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label
                            className={cn(
                              "rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors",
                              "hover:border-primary hover:bg-muted/40"
                            )}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleLogoFile(venue.id, e.dataTransfer.files?.[0]);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage src={venue.logo_url || undefined} alt={`${venue.name} logo`} />
                                <AvatarFallback>
                                  <Upload className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-xs text-muted-foreground">
                                <p className="text-sm font-medium text-foreground">Venue logo</p>
                                {isUploadingLogo ? "Uploading..." : "Drop image or click to upload"}
                              </div>
                              {isUploadingLogo && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                            </div>
                            <Input
                              type="file"
                              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                              className="sr-only"
                              onChange={(e) => {
                                handleLogoFile(venue.id, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          <label
                            className={cn(
                              "rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors",
                              "hover:border-primary hover:bg-muted/40"
                            )}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleMenuFile(venue.id, e.dataTransfer.files?.[0]);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <p className="text-sm font-medium text-foreground">Upload menu PDF</p>
                                {isUploadingMenu ? "Uploading..." : "Drop PDF or click to upload"}
                              </div>
                              {isUploadingMenu && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                            </div>
                            <Input
                              type="file"
                              accept=".pdf,application/pdf"
                              className="sr-only"
                              onChange={(e) => {
                                handleMenuFile(venue.id, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {venueMenusList.length > 0 ? (
                            venueMenusList.map((menu) => (
                              <Badge key={menu.id} variant="secondary" className="gap-1.5 py-1 px-2">
                                <FileText className="h-3 w-3" />
                                <span className="max-w-[160px] truncate">{menu.label || menu.file_name}</span>
                                <button
                                  type="button"
                                  className="ml-1 inline-flex"
                                  onClick={() => deleteMenuMutation.mutate(menu.id)}
                                  disabled={deletingMenuIds.has(menu.id)}
                                >
                                  {deletingMenuIds.has(menu.id) ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </button>
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">No menu PDFs uploaded yet</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No venues added yet</p>
              <p className="text-xs mt-1">Add venue names above to pre-populate the client's portal</p>
            </div>
          )}
        </div>

        {venues && venues.length > 0 && (
          <p className="text-2xs text-muted-foreground text-center">
            {venues.length} venue{venues.length !== 1 ? "s" : ""} configured
          </p>
        )}
      </CardContent>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This venue preset will be removed from the client's portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteVenueMutation.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              {deleteVenueMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
