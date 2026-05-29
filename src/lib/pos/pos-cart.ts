import {
  allocateFefo,
  isExpired,
  isNearExpiry,
  type PosBatchLine,
} from "./pharmacy-rules";

export type PosCartLine = PosBatchLine & { quantity: number };

export function medicationQtyInCart(
  cart: PosCartLine[],
  medicationId: string,
): number {
  return cart
    .filter((l) => l.medicationId === medicationId)
    .reduce((s, l) => s + l.quantity, 0);
}

export function removeMedicationFromCart(
  cart: PosCartLine[],
  medicationId: string,
): PosCartLine[] {
  return cart.filter((l) => l.medicationId !== medicationId);
}

/** Rebuild cart lines for one medication using FEFO across available batches. */
export function setMedicationQuantityInCart(
  cart: PosCartLine[],
  allProducts: PosBatchLine[],
  medicationId: string,
  quantity: number,
  priceByInventoryId: Record<string, number>,
): { cart: PosCartLine[]; error?: string } {
  const without = removeMedicationFromCart(cart, medicationId);
  if (quantity <= 0) return { cart: without };

  const batches = allProducts.filter((p) => p.medicationId === medicationId);
  const { lines, error } = allocateFefo(batches, quantity);
  if (error) return { cart: without, error };

  const newLines: PosCartLine[] = lines.map(({ batch, quantity: qty }) => ({
    ...batch,
    price: priceByInventoryId[batch.id] ?? batch.price,
    quantity: qty,
  }));

  return { cart: [...without, ...newLines] };
}

export type AddToCartResult = {
  cart: PosCartLine[];
  error?: string;
  /** User must acknowledge selling near-expiry stock. */
  needsNearExpiryConfirm?: boolean;
  nearExpiryMessage?: string;
};

export function addMedicationToCart(
  cart: PosCartLine[],
  allProducts: PosBatchLine[],
  batch: PosBatchLine,
  priceByInventoryId: Record<string, number>,
  options?: { acknowledgeNearExpiry?: boolean; addQty?: number },
): AddToCartResult {
  if (isExpired(batch.daysToExpiry)) {
    return { cart, error: "This batch has expired and cannot be sold." };
  }

  const addQty = options?.addQty ?? 1;
  const currentQty = medicationQtyInCart(cart, batch.medicationId);
  const newQty = currentQty + addQty;

  if (
    isNearExpiry(batch.daysToExpiry) &&
    !options?.acknowledgeNearExpiry
  ) {
    return {
      cart,
      needsNearExpiryConfirm: true,
      nearExpiryMessage: `${batch.name} (batch ${batch.batch}) expires in ${batch.daysToExpiry} days. Continue?`,
    };
  }

  const { cart: next, error } = setMedicationQuantityInCart(
    cart,
    allProducts,
    batch.medicationId,
    newQty,
    priceByInventoryId,
  );

  return { cart: next, error };
}

export function setCartLineQuantity(
  cart: PosCartLine[],
  allProducts: PosBatchLine[],
  inventoryId: string,
  quantity: number,
  priceByInventoryId: Record<string, number>,
): { cart: PosCartLine[]; error?: string } {
  const line = cart.find((l) => l.id === inventoryId);
  if (!line) return { cart };
  return setMedicationQuantityInCart(
    cart,
    allProducts,
    line.medicationId,
    quantity,
    priceByInventoryId,
  );
}
