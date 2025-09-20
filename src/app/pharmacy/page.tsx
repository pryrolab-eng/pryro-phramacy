import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Package, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function PharmacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/sign-in");

  const { data: pharmacyUser } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id, role, pharmacies(*)')
    .eq('user_id', user.id)
    .single();

  if (!pharmacyUser || pharmacyUser.role !== 'pharmacy_owner') {
    return redirect("/dashboard");
  }

  const { data: staff } = await supabase
    .from('pharmacy_users')
    .select('*')
    .eq('pharmacy_id', pharmacyUser.pharmacy_id);

  const { data: inventory } = await supabase
    .from('inventory')
    .select('*')
    .eq('pharmacy_id', pharmacyUser.pharmacy_id);

  const { data: todaySales } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('pharmacy_id', pharmacyUser.pharmacy_id)
    .gte('created_at', new Date().toISOString().split('T')[0]);

  const todayRevenue = todaySales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              {pharmacyUser.pharmacies?.name} Management
            </h1>
            <p className="text-gray-600">Manage your pharmacy operations and staff</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">RWF {todayRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{todaySales?.length || 0} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staff?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active employees</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventory?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total medications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pharmacyUser.pharmacies?.subscription_plan}</div>
                <p className="text-xs text-muted-foreground">Current plan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Information</CardTitle>
                <CardDescription>Your pharmacy details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="font-medium">{pharmacyUser.pharmacies?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">License Number</label>
                    <p className="font-medium">{pharmacyUser.pharmacies?.license_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="font-medium">{pharmacyUser.pharmacies?.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="font-medium">{pharmacyUser.pharmacies?.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <Badge className="ml-2 bg-green-100 text-green-800">
                      {pharmacyUser.pharmacies?.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Manage your pharmacy staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Staff Member</p>
                        <p className="text-sm text-gray-600">ID: {member.user_id.slice(0, 8)}...</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{member.role}</Badge>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">Add Staff Member</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}