import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Building2, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const mockBlockers = [
  { 
    id: "1", 
    hotelName: "The Riverside Hotel", 
    reason: "Low order volume detected - 15 orders in last 7 days (threshold: 50)",
    type: "automatic",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "2", 
    hotelName: "Mountain View Lodge", 
    reason: "No activity for 10 days - property manager unresponsive",
    type: "automatic",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "3", 
    hotelName: "Lakefront Inn", 
    reason: "POS integration pending - awaiting API credentials",
    type: "manual",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function Blockers() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Active Blockers</h1>
            <p className="text-sm text-muted-foreground">Issues requiring immediate attention</p>
          </div>
          <Badge variant="destructive" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {mockBlockers.length} Active
          </Badge>
        </div>

        <div className="grid gap-4">
          {mockBlockers.map((blocker) => (
            <Card key={blocker.id} className="border-destructive/30 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    {blocker.hotelName}
                  </CardTitle>
                  <Badge variant={blocker.type === "automatic" ? "secondary" : "outline"} className="gap-1">
                    {blocker.type === "automatic" ? <Zap className="h-3 w-3" /> : null}
                    {blocker.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="text-sm">{blocker.reason}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Created {formatDistanceToNow(blocker.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
