export type SalesReportSaleRow = {
  total_amount: number;
  created_at: string;
  id: string;
  customer_name: string | null;
  payment_method: string | null;
};

export type SalesReportItemRow = {
  medication_name: string;
  total_price: number;
  quantity: number;
};

export function buildSalesReportPayload(
  salesData: SalesReportSaleRow[],
  topProductsData: SalesReportItemRow[],
) {
  const dailyTotals: Record<string, { sales: number; orders: number }> = {};

  salesData.forEach((sale) => {
    const date = sale.created_at.split("T")[0];
    if (!dailyTotals[date]) {
      dailyTotals[date] = { sales: 0, orders: 0 };
    }
    dailyTotals[date].sales += sale.total_amount;
    dailyTotals[date].orders += 1;
  });

  const dailySales = Object.entries(dailyTotals)
    .map(([date, row]) => ({
      date,
      sales: Math.round(row.sales),
      orders: row.orders,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productTotals: Record<string, { sales: number; quantity: number }> = {};
  topProductsData.forEach((item) => {
    const name = item.medication_name;
    if (!productTotals[name]) {
      productTotals[name] = { sales: 0, quantity: 0 };
    }
    productTotals[name].sales += item.total_price;
    productTotals[name].quantity += item.quantity;
  });

  const topProducts = Object.entries(productTotals)
    .map(([name, data]) => ({
      name,
      sales: Math.round(data.sales),
      quantity: data.quantity,
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);

  const paymentTotals: Record<string, number> = {};
  let totalAmount = 0;

  salesData.forEach((sale) => {
    const method =
      sale.payment_method === "mobile_money"
        ? "Mobile Money"
        : sale.payment_method === "cash"
          ? "Cash"
          : sale.payment_method === "insurance"
            ? "Insurance"
            : "Card";
    paymentTotals[method] = (paymentTotals[method] || 0) + sale.total_amount;
    totalAmount += sale.total_amount;
  });

  const paymentBreakdown = Object.entries(paymentTotals).map(([method, amount]) => ({
    method,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    amount: Math.round(amount),
  }));

  const uniqueCustomers = new Set(
    salesData.map((s) => s.customer_name).filter(Boolean),
  ).size;

  return {
    dailySales,
    topProducts,
    paymentBreakdown,
    totalSales: Math.round(totalAmount),
    totalOrders: salesData.length,
    activeCustomers: uniqueCustomers,
  };
}

export type InventoryReportRow = {
  quantity_in_stock: number | null;
  minimum_stock_level: number | null;
  expiry_date: string | null;
  created_at: string;
};

export function buildInventoryAlertsReport(rows: InventoryReportRow[]) {
  const dailyData: Record<
    string,
    { lowStock: number; expiring: number; totalItems: number }
  > = {};

  rows.forEach((item) => {
    const date = item.created_at.split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = { lowStock: 0, expiring: 0, totalItems: 0 };
    }

    dailyData[date].totalItems++;

    const qty = item.quantity_in_stock ?? 0;
    const min = item.minimum_stock_level ?? 0;
    if (qty <= min) {
      dailyData[date].lowStock++;
    }

    if (item.expiry_date) {
      const daysToExpiry = Math.ceil(
        (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      if (daysToExpiry <= 60 && daysToExpiry > 0) {
        dailyData[date].expiring++;
      }
    }
  });

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    ...data,
  }));
}

export type PharmacyDashboardSaleRow = {
  total_amount: number;
  customer_name: string | null;
  id: string;
};

export function buildPharmacyDashboardStats(input: {
  todayTotal: number;
  monthlyRevenue: number;
  rangeSales: PharmacyDashboardSaleRow[];
  totalProducts: number;
  activeStaff: number;
  branchId?: string | null;
}) {
  const uniqueCustomers = new Set(
    input.rangeSales.map((s) => s.customer_name).filter(Boolean),
  ).size;

  return {
    totalProducts: input.totalProducts,
    lowStockItems: 0,
    todaySales: Math.round(input.todayTotal),
    monthlyRevenue: Math.round(input.monthlyRevenue),
    totalCustomers: uniqueCustomers,
    activeStaff: input.activeStaff,
    pendingOrders: input.rangeSales.length,
    expiringProducts: 0,
    branchId: input.branchId ?? null,
  };
}

export type SalesChartRow = {
  total_amount: number;
  created_at: string;
};

export function buildMonthlySalesChart(salesData: SalesChartRow[]) {
  const monthlyData: Record<string, number> = {};
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  salesData.forEach((sale) => {
    const month = months[new Date(sale.created_at).getMonth()];
    monthlyData[month] = (monthlyData[month] || 0) + sale.total_amount;
  });

  return Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue: Math.round(Number(revenue)),
  }));
}

export type InventoryChartRow = {
  quantity_in_stock: number | null;
  minimum_stock_level: number | null;
  created_at: string;
  updated_at: string | null;
};

export function buildInventoryChart(rows: InventoryChartRow[]) {
  const monthlyData: Record<string, { inStock: number; lowStock: number }> = {};

  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-US", { month: "short" }));
  }

  rows.forEach((item) => {
    const d = new Date(item.updated_at ?? item.created_at);
    const monthKey = d.toLocaleString("en-US", { month: "short" });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { inStock: 0, lowStock: 0 };
    }
    const qty = item.quantity_in_stock ?? 0;
    const min = item.minimum_stock_level ?? 0;
    if (qty <= min) {
      monthlyData[monthKey].lowStock++;
    } else {
      monthlyData[monthKey].inStock++;
    }
  });

  return months.map((month) => ({
    month,
    inStock: monthlyData[month]?.inStock || 0,
    lowStock: monthlyData[month]?.lowStock || 0,
  }));
}

export type CategorySaleItemRow = {
  total_price: number;
  category: string;
};

export function buildCategorySalesChart(rows: CategorySaleItemRow[]) {
  const categoryTotals: Record<string, number> = {};
  rows.forEach((item) => {
    const category = item.category || "other";
    categoryTotals[category] =
      (categoryTotals[category] || 0) + item.total_price;
  });

  return Object.entries(categoryTotals).map(([category, sales]) => ({
    category,
    sales: Math.round(Number(sales)),
    fill: `var(--color-${category})`,
  }));
}

export type WeeklySaleItemRow = {
  total_price: number;
  created_at: string;
  category: string | null;
};

export function buildWeeklySalesChart(rows: WeeklySaleItemRow[]) {
  const dailyData: Record<string, { prescription: number; otc: number }> = {};
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  rows.forEach((item) => {
    const dayIndex = new Date(item.created_at).getDay();
    const day = days[dayIndex === 0 ? 6 : dayIndex - 1];
    if (!dailyData[day]) {
      dailyData[day] = { prescription: 0, otc: 0 };
    }
    if (item.category === "prescription") {
      dailyData[day].prescription += item.total_price;
    } else {
      dailyData[day].otc += item.total_price;
    }
  });

  return days.map((day) => ({
    day,
    prescription: Math.round(dailyData[day]?.prescription ?? 0),
    otc: Math.round(dailyData[day]?.otc ?? 0),
  }));
}
