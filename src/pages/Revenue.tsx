import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Building2, Calendar } from "lucide-react";

const mockRevenue = [
  { id: "1", hotel: "Royal Plaza Hotel", arr: 48000, contractDate: "2024-10-01", trend: "+12%" },
  { id: "2", hotel: "Grand Metropolitan", arr: 72000, contractDate: "2024-08-15", trend: "+8%" },
  { id: "3", hotel: "The Landmark Hotel", arr: 36000, contractDate: "2024-11-01", trend: "+15%" },
];

const totalARR = mockRevenue.reduce((sum, r) => sum + r.arr, 0);

export default function Revenue() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Revenue</h1>
            <p className="text-sm text-muted-foreground">Annual recurring revenue overview</p>
          </div>
          <Badge className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-base px-3 py-1.5">
            <DollarSign className="h-4 w-4" />
            ${totalARR.toLocaleString()} ARR
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${totalARR.toLocaleString()}</div>
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +11% from last quarter
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contracted Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockRevenue.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active revenue-generating</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Contract Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${Math.round(totalARR / mockRevenue.length).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per client annually</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRevenue.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{item.hotel}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Contracted {item.contractDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${item.arr.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {item.trend}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
