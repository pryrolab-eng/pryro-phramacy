/** @type {import('next').Redirect[]} — keep in sync with pharmacy-paths.ts */
module.exports = [
  { source: "/pharmacy-dashboard", destination: "/pharmacy/dashboard", permanent: true },
  {
    source: "/pharmacy-dashboard/billing",
    destination: "/pharmacy/billing",
    permanent: true,
  },
  {
    source: "/pharmacist-dashboard",
    destination: "/pharmacy/pharmacist",
    permanent: true,
  },
  { source: "/inventory", destination: "/pharmacy/inventory", permanent: true },
  { source: "/pos", destination: "/pharmacy/pos", permanent: true },
  { source: "/sales", destination: "/pharmacy/sales", permanent: true },
  { source: "/customers", destination: "/pharmacy/customers", permanent: true },
  { source: "/patients", destination: "/pharmacy/patients", permanent: true },
  {
    source: "/prescriptions",
    destination: "/pharmacy/prescriptions",
    permanent: true,
  },
  { source: "/reports", destination: "/pharmacy/reports", permanent: true },
  { source: "/activity", destination: "/pharmacy/activity", permanent: true },
  { source: "/settings", destination: "/pharmacy/settings", permanent: true },
  { source: "/branches", destination: "/pharmacy/branches", permanent: true },
  { source: "/staff", destination: "/pharmacy/staff", permanent: true },
  { source: "/superadmin", destination: "/admin", permanent: true },
  { source: "/superadmin/:path*", destination: "/admin/:path*", permanent: true },
];
