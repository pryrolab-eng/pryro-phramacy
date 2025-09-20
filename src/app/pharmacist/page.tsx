import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pill, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function PharmacistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/sign-in");

  const { data: pharmacyUser } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role, pharmacies(*)')
    .eq('user_id', user.id)
    .single();

  if (!pharmacyUser || pharmacyUser.role !== 'pharmacist') {
    return redirect("/dashboard");
  }

  const { data: prescriptions } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items(medication_name, quantity)
    `)
    .eq('pharmacy_id', pharmacyUser.pharmacy_id)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: lowStock } = await supabase
    .from('inventory_alerts')
    .select('*')
    .eq('pharmacy_id', pharmacyUser.pharmacy_id)
    .eq('alert_type', 'low_stock');

  const { data: expiring } = await supabase
    .from('inventory_alerts')
    .select('*')
    .eq('pharmacy_id', pharmacyUser.pharmacy_id)
    .eq('alert_type', 'expiring_soon');

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Pill className="h-8 w-8 text-blue-600" />
              Pharmacist Dashboard
            </h1>
            <p className="text-gray-600">Monitor prescriptions, inventory alerts, and medication safety</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
                <Pill className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prescriptions?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Dispensed today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStock?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{expiring?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Within 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">All checks passed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Inventory Alerts
                </CardTitle>
                <CardDescription>Medications requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStock?.concat(expiring || []).map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium">{alert.medication_name}</p>
                        <p className="text-sm text-gray-600">
                          Stock: {alert.quantity_in_stock} | Min: {alert.minimum_stock_level}
                        </p>
                        <p className="text-xs text-gray-500">Expires: {alert.expiry_date}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {alert.alert_type === 'low_stock' ? 'Low Stock' : 'Expiring Soon'}
                      </Badge>
                    </div>
                  ))}
                  {(!lowStock?.length && !expiring?.length) && (
                    <p className="text-gray-500 text-center py-4">No alerts at this time</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Prescriptions</CardTitle>
                <CardDescription>Latest dispensed medications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prescriptions?.map((prescription) => (
                    <div key={prescription.id} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{prescription.customer_name || 'Walk-in Patient'}</p>
                        <Badge className="bg-blue-100 text-blue-800">Dispensed</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {prescription.sale_items?.map((item: any) => item.medication_name).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(prescription.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {!prescriptions?.length && (
                    <p className="text-gray-500 text-center py-4">No prescriptions today</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}