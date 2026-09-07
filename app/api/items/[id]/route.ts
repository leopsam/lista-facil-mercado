import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapItem } from "@/lib/mappers";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const sql = database();
  const currentRows = await sql`SELECT * FROM purchase_items WHERE id = ${id}`;
  if (!currentRows.length) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  const current = currentRows[0];
  const name = body.name === undefined ? String(current.name) : String(body.name).trim().slice(0, 160);
  const quantity = body.quantity === undefined ? Number(current.quantity) : Math.max(0, Number(body.quantity) || 0);
  const allowedUnits = ["un", "kg", "g", "L", "ml", "pct", "cx"];
  const unit = body.unit === undefined ? String(current.unit) : allowedUnits.includes(body.unit) ? body.unit : "un";
  const unitPrice = body.unitPrice === undefined ? Number(current.unit_price) : Math.max(0, Number(body.unitPrice) || 0);
  const picked = body.picked === undefined ? Boolean(current.picked) : Boolean(body.picked);
  if (!name) return NextResponse.json({ error: "Informe o nome do produto." }, { status: 400 });
  const rows = await sql`
    UPDATE purchase_items SET name = ${name}, quantity = ${quantity}, unit = ${unit},
      unit_price = ${unitPrice}, picked = ${picked}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, purchase_id, name, quantity, unit, unit_price, picked, position
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(current.purchase_id)}`;
  return NextResponse.json({ item: mapItem(rows[0]) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const sql = database();
  await sql`DELETE FROM purchase_items WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
