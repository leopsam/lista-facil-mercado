import { NextResponse } from "next/server";
import { database, databaseEnabled } from "@/lib/db";
import { mapSummary } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!databaseEnabled()) return NextResponse.json({ mode: "demo", purchases: [] });
  const sql = database();
  const rows = await sql`
    SELECT p.id, p.purchase_date, p.status,
      COUNT(i.id)::int AS item_count,
      COUNT(i.id) FILTER (WHERE i.picked)::int AS picked_count,
      COALESCE(SUM(i.quantity * i.unit_price), 0)::numeric AS total
    FROM purchases p
    LEFT JOIN purchase_items i ON i.purchase_id = p.id
    GROUP BY p.id
    ORDER BY p.purchase_date DESC, p.created_at DESC
  `;
  return NextResponse.json({ mode: "database", purchases: rows.map(mapSummary) });
}

export async function POST(request: Request) {
  if (!databaseEnabled()) return NextResponse.json({ error: "Banco não configurado." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const purchaseDate = typeof body.purchaseDate === "string" ? body.purchaseDate : new Date().toISOString().slice(0, 10);
  const sql = database();
  const active = await sql`SELECT id FROM purchases WHERE status = 'active' LIMIT 1`;
  if (active.length) return NextResponse.json({ id: active[0].id }, { status: 200 });
  const rows = await sql`INSERT INTO purchases (purchase_date) VALUES (${purchaseDate}) RETURNING id`;
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
