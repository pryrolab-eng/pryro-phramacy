import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface DailySale {
  date: string;
  sales?: number;
  orders?: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  sales: number;
}

interface PaymentBreakdownItem {
  method: string;
  amount: number;
  percentage: number;
}

interface ReportsData {
  dailySales: DailySale[];
  topProducts: TopProduct[];
  paymentBreakdown: PaymentBreakdownItem[];
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
}

interface InventoryAlert {
  date: string;
  lowStock?: number;
  expiring?: number;
  totalItems?: number;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function exportReportsPdf(
  reportsData: ReportsData,
  inventoryData: InventoryAlert[],
  opts: { title?: string; startDate?: string; endDate?: string } = {},
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  const title = opts.title ?? "Pharmacy Reports";
  const subtitle =
    opts.startDate && opts.endDate
      ? `${opts.startDate} — ${opts.endDate}`
      : `Generated ${formatDate(new Date())}`;

  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(subtitle, pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  doc.setFontSize(13);
  doc.text("Summary", 14, y);
  y += 2;
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Sales", `${reportsData.totalSales.toLocaleString()} RWF`],
      ["Total Orders", String(reportsData.totalOrders)],
      ["Active Customers", String(reportsData.activeCustomers)],
      [
        "Avg Order Value",
        reportsData.totalOrders > 0
          ? `${Math.round(reportsData.totalSales / reportsData.totalOrders).toLocaleString()} RWF`
          : "0 RWF",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (reportsData.dailySales.length > 0) {
    doc.setFontSize(13);
    doc.text("Daily Sales", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Sales (RWF)", "Orders"]],
      body: reportsData.dailySales.map((d) => [
        d.date,
        (d.sales ?? 0).toLocaleString(),
        String(d.orders ?? 0),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (reportsData.topProducts.length > 0) {
    doc.setFontSize(13);
    doc.text("Top Products", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Product", "Units Sold", "Revenue (RWF)"]],
      body: reportsData.topProducts.map((p) => [
        p.name,
        String(p.quantity),
        p.sales.toLocaleString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (reportsData.paymentBreakdown.length > 0) {
    doc.setFontSize(13);
    doc.text("Payment Breakdown", 14, y);
    y += 2;
    autoTable(doc, {
      startY: y,
      head: [["Method", "Amount (RWF)", "%"]],
      body: reportsData.paymentBreakdown.map((p) => [
        p.method,
        p.amount.toLocaleString(),
        `${p.percentage.toFixed(1)}%`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`pharmacy-reports-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportReportsExcel(
  reportsData: ReportsData,
  inventoryData: InventoryAlert[],
  opts: { title?: string } = {},
) {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ["Metric", "Value"],
    ["Total Sales", reportsData.totalSales],
    ["Total Orders", reportsData.totalOrders],
    ["Active Customers", reportsData.activeCustomers],
    [
      "Avg Order Value",
      reportsData.totalOrders > 0
        ? Math.round(reportsData.totalSales / reportsData.totalOrders)
        : 0,
    ],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  if (reportsData.dailySales.length > 0) {
    const rows: (string | number)[][] = [["Date", "Sales (RWF)", "Orders"]];
    for (const d of reportsData.dailySales) {
      rows.push([d.date, d.sales ?? 0, d.orders ?? 0]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Daily Sales");
  }

  if (reportsData.topProducts.length > 0) {
    const rows: (string | number)[][] = [["Product", "Units Sold", "Revenue (RWF)"]];
    for (const p of reportsData.topProducts) {
      rows.push([p.name, p.quantity, p.sales]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Top Products");
  }

  if (reportsData.paymentBreakdown.length > 0) {
    const rows: (string | number)[][] = [["Method", "Amount (RWF)", "%"]];
    for (const p of reportsData.paymentBreakdown) {
      rows.push([p.method, p.amount, p.percentage]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Payment Methods");
  }

  if (inventoryData.length > 0) {
    const rows: (string | number)[][] = [["Date", "Low Stock", "Expiring Soon"]];
    for (const d of inventoryData) {
      rows.push([d.date, d.lowStock ?? 0, d.expiring ?? 0]);
    }
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, "Inventory Alerts");
  }

  XLSX.writeFile(wb, `pharmacy-reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
