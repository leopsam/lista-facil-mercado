import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapItem, mapWeighing } from "@/lib/mappers";

const ALLOWED_UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const sql = database();
  const currentRows = await sql`SELECT * FROM purchase_items WHERE id = ${id}`;
  if (!currentRows.length) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });

  const current = currentRows[0];
  const name = body.name === undefined ? String(current.name) : String(body.name).trim().slice(0, 160);
  const category = body.category === undefined ? String(current.category ?? "Geral") : String(body.category).trim().slice(0, 60) || "Geral";
  const purchaseMode = body.purchaseMode === undefined
    ? (current.purchase_mode === "weighted" ? "weighted" : "standard")
    : (body.purchaseMode === "weighted" ? "weighted" : "standard");
  const targetQuantity = body.targetQuantity === undefined ? Number(current.target_quantity ?? 0) : Math.max(0, Number(body.targetQuantity) || 0);
  const quantity = purchaseMode === "weighted" ? 0 : body.quantity === undefined ? Number(current.quantity) : Math.max(0, Number(body.quantity) || 0);
  const unit = purchaseMode === "weighted" ? "kg" : body.unit === undefined ? String(current.unit) : ALLOWED_UNITS.includes(body.unit) ? body.unit : "un";
  const unitPrice = purchaseMode === "weighted" ? 0 : body.unitPrice === undefined ? Number(current.unit_price) : Math.max(0, Number(body.unitPrice) || 0);
  const picked = body.picked === undefined ? Boolean(current.picked) : Boolean(body.picked);
  if (!name) return NextResponse.json({ error: "Informe o nome do produto." }, { status: 400 });

  const rows = await sql`
    UPDATE purchase_items SET
      name = ${name}, category = ${category}, purchase_mode = ${purchaseMode}, target_quantity = ${targetQuantity},
      quantity = ${quantity}, unit = ${unit}, unit_price = ${unitPrice}, picked = ${picked}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, purchase_id, name, category, purchase_mode, target_quantity,
      quantity, unit, unit_price, picked, position
  `;
  const weighingRows = await sql`
    SELECT id, item_id, weight_kg, total_price, position
    FROM item_weighings WHERE item_id = ${id}
    ORDER BY position, created_at
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(current.purchase_id)}`;
  return NextResponse.json({ item: mapItem(rows[0], weighingRows.map(mapWeighing)) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const sql = database();
  const currentRows = await sql`SELECT purchase_id FROM purchase_items WHERE id = ${id}`;
  await sql`DELETE FROM purchase_items WHERE id = ${id}`;
  if (currentRows.length) await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(currentRows[0].purchase_id)}`;
  return NextResponse.json({ success: true });
}
