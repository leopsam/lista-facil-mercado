import type { Purchase, PurchaseItem, PurchaseSummary } from "./types";

type Row = Record<string, unknown>;

function mapDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value ?? "");
  const isoDate = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  throw new Error("Data da compra inválida.");
}

export function mapItem(row: Row): PurchaseItem {
  return {
    id: String(row.id),
    purchaseId: String(row.purchase_id),
    name: String(row.name ?? ""),
    quantity: Number(row.quantity),
    unit: String(row.unit ?? "un"),
    unitPrice: Number(row.unit_price),
    picked: Boolean(row.picked),
    position: Number(row.position),
  };
}

export function mapPurchase(row: Row, items: PurchaseItem[] = []): Purchase {
  return {
    id: String(row.id),
    purchaseDate: mapDate(row.purchase_date),
    status: row.status === "finished" ? "finished" : "active",
    items,
    total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
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
