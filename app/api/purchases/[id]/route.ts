import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapItem, mapPurchase } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const sql = database();
  const purchases = await sql`SELECT id, purchase_date, status FROM purchases WHERE id = ${id}`;
  if (!purchases.length) return NextResponse.json({ error: "Compra não encontrada." }, { status: 404 });
  const rows = await sql`
    SELECT id, purchase_id, name, quantity, unit, unit_price, picked, position
    FROM purchase_items WHERE purchase_id = ${id}
    ORDER BY position, created_at
  `;
  return NextResponse.json({ purchase: mapPurchase(purchases[0], rows.map(mapItem)) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json();
  const sql = database();
  if (body.status === "finished") {
    await sql`UPDATE purchases SET status = 'finished', updated_at = NOW() WHERE id = ${id}`;
  } else if (typeof body.purchaseDate === "string") {
    await sql`UPDATE purchases SET purchase_date = ${body.purchaseDate}, updated_at = NOW() WHERE id = ${id}`;
  } else {
    return NextResponse.json({ error: "Alteração inválida." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
