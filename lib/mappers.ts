import type { ItemWeighing, Purchase, PurchaseItem, PurchaseSummary } from "./types";

type Row = Record<string, unknown>;

function mapDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value ?? "");
  const isoDate = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  throw new Error("Data da compra inválida.");
}

export function mapWeighing(row: Row): ItemWeighing {
  return {
    id: String(row.id),
    itemId: String(row.item_id),
    weightKg: Number(row.weight_kg),
    totalPrice: Number(row.total_price),
    position: Number(row.position),
  };
}

export function mapItem(row: Row, weighings: ItemWeighing[] = []): PurchaseItem {
  return {
    id: String(row.id),
    purchaseId: String(row.purchase_id),
    name: String(row.name ?? ""),
    category: String(row.category ?? "Geral"),
    purchaseMode: row.purchase_mode === "weighted" ? "weighted" : "standard",
    targetQuantity: Number(row.target_quantity ?? 0),
    quantity: Number(row.quantity),
    unit: String(row.unit ?? "un"),
    unitPrice: Number(row.unit_price),
    picked: Boolean(row.picked),
    position: Number(row.position),
    weighings,
  };
}

export function itemTotal(item: PurchaseItem): number {
  return item.purchaseMode === "weighted"
    ? item.weighings.reduce((sum, weighing) => sum + weighing.totalPrice, 0)
    : item.quantity * item.unitPrice;
}

export function mapPurchase(row: Row, items: PurchaseItem[] = []): Purchase {
  return {
    id: String(row.id),
    purchaseDate: mapDate(row.purchase_date),
    status: row.status === "finished" ? "finished" : "active",
    items,
    total: items.reduce((sum, item) => sum + itemTotal(item), 0),
    pickedCount: items.filter((item) => item.picked).length,
  };
}

export function mapSummary(row: Row): PurchaseSummary {
  return {
    id: String(row.id),
    purchaseDate: mapDate(row.purchase_date),
    status: row.status === "finished" ? "finished" : "active",
    itemCount: Number(row.item_count),
    pickedCount: Number(row.picked_count),
    total: Number(row.total),
  };
}
