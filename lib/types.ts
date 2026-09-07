export type PurchaseStatus = "active" | "finished";

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  picked: boolean;
  position: number;
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  status: PurchaseStatus;
  items: PurchaseItem[];
  total: number;
  pickedCount: number;
}

export interface PurchaseSummary {
  id: string;
  purchaseDate: string;
  status: PurchaseStatus;
  itemCount: number;
  pickedCount: number;
  total: number;
}
