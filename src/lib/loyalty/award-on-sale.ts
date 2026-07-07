import { prisma } from "@/lib/db/prisma";

const POINTS_PER_100_RWF = 1;

function loyaltyTier(points: number): string {
  if (points >= 500) return "Gold";
  if (points >= 200) return "Silver";
  return "Bronze";
}

export async function awardLoyaltyForSale(input: {
  pharmacyId: string;
  customerId?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  saleTotal: number;
}): Promise<{ awarded: boolean; points?: number; customerId?: string }> {
  let customer: { id: string; name: string } | null = null;

  if (input.customerId) {
    customer = await prisma.customers.findFirst({
      where: { pharmacy_id: input.pharmacyId, id: input.customerId },
      select: { id: true, name: true },
    });
  }

  if (!customer) {
    const phone = input.customerPhone?.trim();
    if (!phone) return { awarded: false };

    customer = await prisma.customers.findFirst({
      where: { pharmacy_id: input.pharmacyId, phone },
      select: { id: true, name: true },
    });
  }

  if (!customer) return { awarded: false };

  const pointsEarned = Math.max(
    0,
    Math.floor(input.saleTotal / 100) * POINTS_PER_100_RWF,
  );
  if (pointsEarned <= 0) return { awarded: false, customerId: customer.id };

  const existing = await prisma.customer_loyalty.findFirst({
    where: { pharmacy_id: input.pharmacyId, customer_id: customer.id },
    select: { id: true, points: true, total_spent: true },
  });

  const nextPoints = (existing?.points ?? 0) + pointsEarned;
  const nextSpent =
    Number(existing?.total_spent ?? 0) + Math.max(0, input.saleTotal);

  if (existing) {
    await prisma.customer_loyalty.update({
      where: { id: existing.id },
      data: {
        points: nextPoints,
        tier: loyaltyTier(nextPoints),
        total_spent: nextSpent,
        updated_at: new Date(),
      },
    });
  } else {
    await prisma.customer_loyalty.create({
      data: {
        pharmacy_id: input.pharmacyId,
        customer_id: customer.id,
        points: nextPoints,
        tier: loyaltyTier(nextPoints),
        total_spent: nextSpent,
      },
    });
  }

  return { awarded: true, points: pointsEarned, customerId: customer.id };
}
