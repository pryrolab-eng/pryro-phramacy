import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import {
  findInsuranceProviderByNameFromDb,
  findMedicationByNameFromDb,
  findInventorySellingPriceFromDb,
  loadPharmacyInvoiceContextFromDb,
} from "@/lib/db/insurance";

type InvoiceItemInput = {
  name: string;
  price: number;
  quantity: number;
};

export async function buildInsuranceInvoiceData(input: {
  pharmacyId: string;
  insuranceType: string;
  items: InvoiceItemInput[];
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  relationship?: string;
  affiliateName?: string;
  dateOfBirth?: string;
  dutyStation?: string;
  insuranceTIN?: string;
  doctorName?: string;
  mrcCode?: string;
}) {
  const pharmacy = await loadPharmacyInvoiceContextFromDb(input.pharmacyId);
  const insurance = await findInsuranceProviderByNameFromDb(
    input.pharmacyId,
    input.insuranceType,
  );

  const coveragePercent = Number(
    insurance?.default_coverage_percent ?? insurance?.coverage_percentage ?? 0,
  );

  const receiptNumber = `RCP-${Date.now()}`;
  const currentDate = new Date();

  let totalAmount = 0;
  let taxAmount = 0;

  const processedItems = await Promise.all(
    input.items.map(async (item) => {
      const med = await findMedicationByNameFromDb(input.pharmacyId, item.name);
      let insurancePrice = item.price;

      if (med) {
        const shelf =
          (await findInventorySellingPriceFromDb(
            input.pharmacyId,
            med.id,
          )) || item.price;

        const totals = await computeInsuranceCoverage({
          pharmacyId: input.pharmacyId,
          providerIdOrName: insurance?.id ?? input.insuranceType,
          lines: [
            {
              medicationId: med.id,
              quantity: item.quantity,
              shelfUnitPrice: shelf,
            },
          ],
        });

        const line = totals?.lines[0];
        if (line?.isCovered) {
          insurancePrice = shelf;
        }
      }

      const total = item.quantity * insurancePrice;
      totalAmount += total;
      taxAmount += total * 0.18;

      const coverageAmount = (total * coveragePercent) / 100;
      const patientAmount = total - coverageAmount;

      return {
        ...item,
        insurancePrice,
        pharmacyPrice: item.price,
        total,
        insuranceCoverage: coverageAmount,
        patientPortion: patientAmount,
      };
    }),
  );

  return {
    pharmacyName: pharmacy?.name || "Pharmacy",
    pharmacyAddress: pharmacy?.address || "",
    pharmacyPhone: pharmacy?.phone || "",
    pharmacyTIN: pharmacy?.rra_tin || "",
    insuranceName: insurance?.name || input.insuranceType,
    insurancePercentage: coveragePercent,
    receiptNumber,
    date: currentDate.toLocaleDateString("en-GB"),
    time: currentDate.toLocaleTimeString("en-GB", { hour12: false }),
    sdcId: `SDC-${Date.now()}`,
    beneficialNumber: input.patientId,
    beneficialName: input.patientName || "Patient Name",
    relationship: input.relationship || "Self",
    telephone: input.patientPhone || "",
    affiliateName: input.affiliateName || input.patientName,
    dateOfBirth: input.dateOfBirth || "",
    dutyStation: input.dutyStation || "",
    insuranceTIN: input.insuranceTIN || "",
    doctorName: input.doctorName || "",
    mrcCode: input.mrcCode || "",
    items: processedItems,
    totalAmount,
    taxAmount,
    totalWithTax: totalAmount + taxAmount,
    insuranceAmount: (totalAmount * coveragePercent) / 100,
    patientAmount: (totalAmount * (100 - coveragePercent)) / 100,
    patientPercentage: 100 - coveragePercent,
  };
}
