import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapItem } from "@/lib/mappers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const name = String(body.name ?? "").trim().slice(0, 160);
  const quantity = Math.max(0, Number(body.quantity) || 0);
  const unit = ["un", "kg", "g", "L", "ml", "pct", "cx"].includes(body.unit) ? body.unit : "un";
  const unitPrice = Math.max(0, Number(body.unitPrice) || 0);
  if (!name) return NextResponse.json({ error: "Informe o nome do produto." }, { status: 400 });
  const sql = database();
  const positionRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS position FROM purchase_items WHERE purchase_id = ${id}`;
  const rows = await sql`
    INSERT INTO purchase_items (purchase_id, name, quantity, unit, unit_price, position)
    VALUES (${id}, ${name}, ${quantity}, ${unit}, ${unitPrice}, ${Number(positionRows[0].position)})
    RETURNING id, purchase_id, name, quantity, unit, unit_price, picked, position
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${id}`;
  return NextResponse.json({ item: mapItem(rows[0]) }, { status: 201 });
}
