export type PurchaseStatus = "active" | "finished";
export type PurchaseMode = "standard" | "weighted";

export interface ItemWeighing {
  id: string;
  itemId: string;
  weightKg: number;
  totalPrice: number;
  position: number;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  name: string;
  category: string;
  purchaseMode: PurchaseMode;
  targetQuantity: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  picked: boolean;
  position: number;
  weighings: ItemWeighing[];
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
