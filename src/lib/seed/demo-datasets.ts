/** Canonical inventory rows loaded into the pharmacy catalog. */
export const DEMO_INVENTORY_PRODUCTS = [
  {
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    stock: 240,
    minStock: 40,
    price: 500,
    expiryDate: "2026-12-31",
    batchNumber: "DEMO-PAR-001",
  },
  {
    name: "Amoxicillin 250mg",
    category: "Antibiotics",
    stock: 120,
    minStock: 25,
    price: 1200,
    expiryDate: "2026-08-30",
    batchNumber: "DEMO-AMX-001",
  },
  {
    name: "Ibuprofen 400mg",
    category: "Pain Relief",
    stock: 180,
    minStock: 30,
    price: 800,
    expiryDate: "2026-10-15",
    batchNumber: "DEMO-IBU-001",
  },
  {
    name: "Metformin 500mg",
    category: "Prescription",
    stock: 90,
    minStock: 20,
    price: 1500,
    expiryDate: "2027-01-20",
    batchNumber: "DEMO-MET-001",
  },
  {
    name: "Cetirizine 10mg",
    category: "OTC",
    stock: 150,
    minStock: 25,
    price: 600,
    expiryDate: "2026-11-30",
    batchNumber: "DEMO-CET-001",
  },
  {
    name: "ORS Sachets",
    category: "OTC",
    stock: 200,
    minStock: 50,
    price: 300,
    expiryDate: "2027-03-01",
    batchNumber: "DEMO-ORS-001",
  },
  {
    name: "Vitamin C 1000mg",
    category: "Vitamins",
    stock: 75,
    minStock: 15,
    price: 2000,
    expiryDate: "2026-09-01",
    batchNumber: "DEMO-VIT-001",
  },
  {
    name: "Azithromycin 500mg",
    category: "Antibiotics",
    stock: 60,
    minStock: 15,
    price: 3500,
    expiryDate: "2026-07-31",
    batchNumber: "DEMO-AZI-001",
  },
] as const;

/** Extra products only in the inventory import file (not pre-seeded). */
export const DEMO_INVENTORY_IMPORT_ONLY = [
  {
    "Product Name": "Artemether/Lumefantrine 20/120",
    Category: "Prescription",
    Stock: 40,
    "Min Stock": 10,
    "Price (RWF)": 4500,
    "Expiry Date": "2026-12-31",
    "Batch Number": "DEMO-ART-001",
  },
  {
    "Product Name": "Zinc Sulphate 20mg",
    Category: "Vitamins",
    Stock: 80,
    "Min Stock": 20,
    "Price (RWF)": 400,
    "Expiry Date": "2027-02-28",
    "Batch Number": "DEMO-ZNC-001",
  },
] as const;

export const DEMO_CUSTOMERS = [
  {
    name: "Jean Mukamana",
    phone: "+250788123456",
    email: "jean.demo@example.com",
    dateOfBirth: "1990-05-12",
    allergies: "Penicillin",
    insuranceNumber: "RSSB-DEMO-1001",
  },
  {
    name: "Paul Nkurunziza",
    phone: "+250789654321",
    email: "paul.demo@example.com",
    dateOfBirth: "1985-11-03",
    allergies: "",
    insuranceNumber: "RSSB-DEMO-1002",
  },
  {
    name: "Alice Uwase",
    phone: "+250788222333",
    email: "alice.demo@example.com",
    dateOfBirth: "1998-02-18",
    allergies: "",
    insuranceNumber: "",
  },
] as const;

export const DEMO_INSURANCE_PROVIDER = {
  name: "RSSB Demo",
  coveragePercentage: 80,
  contactEmail: "claims.demo@rssb.example",
  contactPhone: "+250788000111",
  policyNumber: "RSSB-DEMO-POLICY",
} as const;

/**
 * Insurer formulary with alternate spellings — use this file to test fuzzy match + pharmacist confirm.
 * Metformin is listed but uses a different format; Zinc is on formulary but not in base seed inventory.
 */
export const DEMO_INSURER_FORMULARY_IMPORT = [
  { Name: "PARACETAMOL TAB 500MG", Code: "RSSB-PAR-500", Price: 500 },
  { Name: "AMOXICILLIN CAP 250MG", Code: "RSSB-AMX-250", Price: 1200 },
  { Name: "IBUPROFEN 400mg tablets", Code: "RSSB-IBU-400", Price: 800 },
  { Name: "METFORMIN TAB 500 MG", Code: "RSSB-MET-500", Price: 1500 },
  { Name: "CETIRIZINE 10MG", Code: "RSSB-CET-10", Price: 600 },
  { Name: "ORS SACHET", Code: "RSSB-ORS", Price: 300 },
  { Name: "ZINC SULPHATE 20MG", Code: "RSSB-ZNC-20", Price: 400 },
] as const;

export const DEMO_STAFF_IMPORT = [
  {
    "Full Name": "Demo Pharmacist",
    Email: "demo.pharmacist@pryrox.test",
    Phone: "+250788111222",
    Role: "pharmacist",
  },
] as const;
