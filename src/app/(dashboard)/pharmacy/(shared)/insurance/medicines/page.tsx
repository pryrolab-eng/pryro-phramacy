import { redirect } from "next/navigation";
import { inventoryInsuranceHref } from "@/lib/routes/pharmacy-paths";

type PageProps = {
  searchParams: Promise<{ import?: string }>;
};

/** Legacy URL → Inventory → Insurance tab. */
export default async function PharmacyInsuranceMedicinesRedirect({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  redirect(
    inventoryInsuranceHref({ import: params.import === "1" }),
  );
}
