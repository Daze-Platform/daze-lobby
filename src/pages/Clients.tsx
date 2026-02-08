import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Mail, Phone } from "lucide-react";

const mockClients = [
  { id: "1", name: "The Pearl Hotel", phase: "onboarding", contact: "Sarah Chen", email: "s.chen@pearlhotel.com", phone: "+1 555-0101" },
  { id: "2", name: "Seaside Resort & Spa", phase: "onboarding", contact: "Michael Torres", email: "m.torres@seasideresort.com", phone: "+1 555-0102" },
  { id: "3", name: "Urban Boutique Hotel", phase: "pilot_live", contact: "Emma Williams", email: "e.williams@urbanboutique.com", phone: "+1 555-0104" },
  { id: "4", name: "Royal Plaza Hotel", phase: "contracted", contact: "Jennifer Lee", email: "j.lee@royalplaza.com", phone: "+1 555-0108" },
  { id: "5", name: "Grand Metropolitan", phase: "contracted", contact: "William Johnson", email: "w.johnson@grandmet.com", phone: "+1 555-0109" },
];

const phaseColors: Record<string, string> = {
  onboarding: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  pilot_live: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  contracted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function Clients() {
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
            <Users className="h-3.5 w-3.5" />
            {mockClients.length} Total
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {mockClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                    <span className="truncate">{client.name}</span>
                  </CardTitle>
                  <Badge className={phaseColors[client.phase]}>
                    {client.phase.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{client.contact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>{client.phone}</span>
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
