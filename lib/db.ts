import { neon } from "@neondatabase/serverless";

export function database() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada.");
  return neon(connectionString);
}

export function databaseEnabled() {
  return process.env.NEXT_PUBLIC_USE_DATABASE === "true" && Boolean(process.env.DATABASE_URL);
}
