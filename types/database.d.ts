import type { PostgresStatement } from "@/db/runtime";

declare global {
  type D1PreparedStatement = PostgresStatement;
}

export {};
