export type GlobalSearchCustomerHit = {
  id: string;
  name: string;
  phone?: string | null;
};

export type GlobalSearchProductHit = {
  id: string;
  medicationId: string;
  name: string;
  category?: string | null;
};

export type GlobalSearchPrescriptionHit = {
  id: string;
  patient: string;
  doctor?: string | null;
  status?: string | null;
};

export type GlobalSearchSaleHit = {
  id: string;
  receiptNumber: string;
  customerName?: string | null;
  totalAmount?: number | null;
};

export type GlobalSearchStaffHit = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
};

export type GlobalSearchBranchHit = {
  id: string;
  name: string;
  city?: string | null;
  status?: string | null;
};

export type PharmacyGlobalSearchResult = {
  customers: GlobalSearchCustomerHit[];
  products: GlobalSearchProductHit[];
  prescriptions: GlobalSearchPrescriptionHit[];
  sales: GlobalSearchSaleHit[];
  staff: GlobalSearchStaffHit[];
  branches: GlobalSearchBranchHit[];
};

export type AdminGlobalSearchPharmacyHit = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type AdminGlobalSearchStaffHit = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  pharmacyId: string;
  pharmacyName: string;
};

export type AdminGlobalSearchBranchHit = {
  id: string;
  name: string;
  city?: string | null;
  status?: string | null;
  pharmacyId: string;
  pharmacyName: string;
};

export type AdminGlobalSearchResult = {
  pharmacies: AdminGlobalSearchPharmacyHit[];
  staff: AdminGlobalSearchStaffHit[];
  branches: AdminGlobalSearchBranchHit[];
};
