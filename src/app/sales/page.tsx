import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, TrendingUp } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

export default async function SalesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/sign-in");

  const { data: pharmacyUser } = await supabase
    .from('pharmacy_users')
    .select('pharmacy_id')
    .eq('user_id', user.id)
    .single();

  if (!pharmacyUser) return redirect("/sign-in");

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items(medication_name, quantity, unit_price, total_price)
    `)
    .eq('pharmacy_id', pharmacyUser.pharmacy_id)
    .order('created_at', { ascending: false })
    .limit(50);

  const todaySales = sales?.filter(sale => 
    new Date(sale.created_at).toDateString() === new Date().toDateString()
  ) || [];

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Receipt className="h-8 w-8 text-blue-600" />
              Sales History
            </h1>
            <p className="text-gray-600">View and manage all sales transactions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">RWF {todayRevenue.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{todaySales.length}</div>
                <p className="text-sm text-muted-foreground">Today's Transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{sales?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>Latest transactions from POS system</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales?.map((sale) => (
                  <div key={sale.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{sale.receipt_number}</p>
                        <p className="text-sm text-gray-600">
                          {sale.customer_name || 'Walk-in Customer'} • {new Date(sale.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">RWF {sale.total_amount.toLocaleString()}</p>
                        <Badge className="bg-green-100 text-green-800">{sale.status}</Badge>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Items: {sale.sale_items?.map(item => `${item.medication_name} (${item.quantity})`).join(', ')}</p>
                      <p>Payment: {sale.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}