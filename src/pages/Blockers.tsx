import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Building2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Task step mapping
const TASK_STEPS: Record<string, { letter: string; name: string }> = {
  legal: { letter: "A", name: "Legal & Agreements" },
  brand: { letter: "B", name: "Brand Identity" },
  venue: { letter: "C", name: "Venue Setup" },
  pos: { letter: "D", name: "POS Integration" },
  devices: { letter: "E", name: "Device Setup" },
};

interface MockBlocker {
  id: string;
  hotelName: string;
  reason: string;
  incompleteTask: keyof typeof TASK_STEPS;
  completedTasks: number;
  type: "automatic" | "manual";
  createdAt: Date;
}

const mockBlockers: MockBlocker[] = [
  { 
    id: "1", 
    hotelName: "The Riverside Hotel", 
    reason: "Pilot Agreement not signed - awaiting legal signature",
    incompleteTask: "legal",
    completedTasks: 0,
    type: "automatic",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "2", 
    hotelName: "Mountain View Lodge", 
    reason: "Brand identity incomplete - missing logo upload",
    incompleteTask: "brand",
    completedTasks: 1,
    type: "automatic",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  { 
    id: "3", 
    hotelName: "Lakefront Inn", 
    reason: "POS integration pending - provider not selected",
    incompleteTask: "pos",
    completedTasks: 3,
    type: "automatic",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function Blockers() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Active Blockers</h1>
            <p className="text-sm text-muted-foreground">Incomplete tasks preventing phase transitions</p>
          </div>
          <Badge variant="destructive" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {mockBlockers.length} Active
          </Badge>
        </div>

        <div className="grid gap-4">
          {mockBlockers.map((blocker) => {
            const taskInfo = TASK_STEPS[blocker.incompleteTask];
            const progressPercent = (blocker.completedTasks / 5) * 100;

            return (
              <Card 
                key={blocker.id} 
                className="border-destructive/30 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      {blocker.hotelName}
                    </CardTitle>
                    
                    {/* Task Step Badge */}
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                          "bg-destructive/10 text-destructive border border-destructive/20"
                        )}
                      >
                        {taskInfo.letter}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {taskInfo.name}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Blocker Reason */}
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="text-sm">{blocker.reason}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Onboarding Progress</span>
                        <span className="font-medium">{blocker.completedTasks}/5 tasks</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Created {formatDistanceToNow(blocker.createdAt, { addSuffix: true })}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-1.5 text-primary hover:text-primary"
                        onClick={() => navigate("/portal")}
                      >
                        Open in Portal
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
