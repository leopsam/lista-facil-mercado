import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapWeighing } from "@/lib/mappers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const weightKg = Math.max(0, Number(body.weightKg) || 0);
  const totalPrice = Math.max(0, Number(body.totalPrice) || 0);
  if (weightKg <= 0) return NextResponse.json({ error: "Informe um peso maior que zero." }, { status: 400 });

  const sql = database();
  const itemRows = await sql`SELECT purchase_id, purchase_mode FROM purchase_items WHERE id = ${id}`;
  if (!itemRows.length) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  if (itemRows[0].purchase_mode !== "weighted") return NextResponse.json({ error: "Este produto não usa pesagens fracionadas." }, { status: 400 });

  const positionRows = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS position FROM item_weighings WHERE item_id = ${id}`;
  const rows = await sql`
    INSERT INTO item_weighings (item_id, weight_kg, total_price, position)
    VALUES (${id}, ${weightKg}, ${totalPrice}, ${Number(positionRows[0].position)})
    RETURNING id, item_id, weight_kg, total_price, position
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(itemRows[0].purchase_id)}`;
  return NextResponse.json({ weighing: mapWeighing(rows[0]) }, { status: 201 });
}
