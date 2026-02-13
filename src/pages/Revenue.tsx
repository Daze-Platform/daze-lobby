import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrencyDollar, TrendUp, Buildings, Calendar } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RevenueClient {
  id: string;
  name: string;
  arr: number;
  created_at: string;
}

export default function Revenue() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["revenue-clients"],
    queryFn: async (): Promise<RevenueClient[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, arr, created_at")
        .not("arr", "is", null)
        .gt("arr", 0)
        .order("arr", { ascending: false });
      if (error) throw error;
      return (data || []).map(c => ({
        id: c.id,
        name: c.name,
        arr: c.arr!,
        created_at: c.created_at,
      }));
    },
  });

  const totalARR = clients.reduce((sum, c) => sum + c.arr, 0);
  const avgARR = clients.length > 0 ? Math.round(totalARR / clients.length) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Revenue</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Annual recurring revenue overview</p>
        </div>
        {!isLoading && (
          <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm sm:text-base px-2 sm:px-3 py-1 sm:py-1.5 self-start sm:self-auto">
            <CurrencyDollar size={16} weight="duotone" />
            ${totalARR.toLocaleString()} ARR
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total ARR</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-foreground">${totalARR.toLocaleString()}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {clients.length} contracted client{clients.length !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Contracted Clients</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{clients.length}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Active revenue-generating</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Contract Value</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-foreground">
                  ${avgARR.toLocaleString()}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per client annually</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">Revenue by Client</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CurrencyDollar size={40} weight="duotone" className="text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No revenue data yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Clients with ARR values will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {clients.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b last:border-0 gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Buildings size={20} weight="duotone" className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={12} weight="duotone" />
                        Since {format(new Date(item.created_at), "MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right ml-6 sm:ml-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground">${item.arr.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
