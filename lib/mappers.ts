import type { Purchase, PurchaseItem, PurchaseSummary } from "./types";

type Row = Record<string, unknown>;

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
    purchaseDate: String(row.purchase_date).slice(0, 10),
    status: row.status === "finished" ? "finished" : "active",
    items,
    total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    pickedCount: items.filter((item) => item.picked).length,
  };
}

export function mapSummary(row: Row): PurchaseSummary {
  return {
    id: String(row.id),
    purchaseDate: String(row.purchase_date).slice(0, 10),
    status: row.status === "finished" ? "finished" : "active",
    itemCount: Number(row.item_count),
    pickedCount: Number(row.picked_count),
    total: Number(row.total),
  };
}
