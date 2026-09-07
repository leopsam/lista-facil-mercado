import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapItem } from "@/lib/mappers";

const ALLOWED_UNITS = ["un", "kg", "g", "L", "ml", "pct", "cx"];

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 160);
  const category = String(body.category ?? "Geral").trim().slice(0, 60) || "Geral";
  const purchaseMode = body.purchaseMode === "weighted" ? "weighted" : "standard";
  const targetQuantity = Math.max(0, Number(body.targetQuantity) || 0);
  const quantity = purchaseMode === "weighted" ? 0 : Math.max(0, Number(body.quantity) || 0);
  const unit = purchaseMode === "weighted" ? "kg" : ALLOWED_UNITS.includes(body.unit) ? body.unit : "un";
  const unitPrice = purchaseMode === "weighted" ? 0 : Math.max(0, Number(body.unitPrice) || 0);
  if (!name) return NextResponse.json({ error: "Informe o nome do produto." }, { status: 400 });

  const sql = database();
  const positionRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS position FROM purchase_items WHERE purchase_id = ${id}`;
  const rows = await sql`
    INSERT INTO purchase_items (
      purchase_id, name, category, purchase_mode, target_quantity,
      quantity, unit, unit_price, position
    )
    VALUES (
      ${id}, ${name}, ${category}, ${purchaseMode}, ${targetQuantity},
      ${quantity}, ${unit}, ${unitPrice}, ${Number(positionRows[0].position)}
    )
    RETURNING id, purchase_id, name, category, purchase_mode, target_quantity,
      quantity, unit, unit_price, picked, position
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ item: mapItem(rows[0]) }, { status: 201 });
}
