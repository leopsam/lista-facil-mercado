import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapWeighing } from "@/lib/mappers";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const sql = database();
  const currentRows = await sql`
    SELECT w.*, i.purchase_id
    FROM item_weighings w
    JOIN purchase_items i ON i.id = w.item_id
    WHERE w.id = ${id}
  `;
  if (!currentRows.length) return NextResponse.json({ error: "Pesagem não encontrada." }, { status: 404 });

  const current = currentRows[0];
  const weightKg = body.weightKg === undefined ? Number(current.weight_kg) : Math.max(0, Number(body.weightKg) || 0);
  const totalPrice = body.totalPrice === undefined ? Number(current.total_price) : Math.max(0, Number(body.totalPrice) || 0);
  if (weightKg <= 0) return NextResponse.json({ error: "Informe um peso maior que zero." }, { status: 400 });

  const rows = await sql`
    UPDATE item_weighings
    SET weight_kg = ${weightKg}, total_price = ${totalPrice}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, item_id, weight_kg, total_price, position
  `;
  await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(current.purchase_id)}`;
  return NextResponse.json({ weighing: mapWeighing(rows[0]) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const sql = database();
  const currentRows = await sql`
    SELECT i.purchase_id
    FROM item_weighings w
    JOIN purchase_items i ON i.id = w.item_id
    WHERE w.id = ${id}
  `;
  await sql`DELETE FROM item_weighings WHERE id = ${id}`;
  if (currentRows.length) await sql`UPDATE purchases SET updated_at = NOW() WHERE id = ${String(currentRows[0].purchase_id)}`;
  return NextResponse.json({ success: true });
}
