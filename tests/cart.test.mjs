import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function cartRoute(available = 10) {
  const items = new Map([[1, 2], [2, 1]]);
  const database = {
    prepare(sql) {
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async first() {
          if (sql.includes("FROM carts")) return { id: 7 };
          if (sql.includes("ci.quantity,v.product_id")) return items.has(values[1]) ? { quantity: items.get(values[1]), product_id: 4, is_unique_find: 0 } : null;
          if (sql.includes("reserved_stock available")) return { available };
          if (sql.includes("SELECT quantity FROM cart_items")) return { quantity: items.get(values[1]) || 0 };
          throw new Error(`Unexpected query: ${sql}`);
        },
        async run() {
          if (sql.includes("DELETE FROM cart_items")) items.delete(values[1]);
          if (sql.includes("INSERT INTO cart_items")) items.set(values[1], values[2]);
        },
      };
    },
    async batch(writes) { for (const write of writes) await write.run(); },
  };
  const source = (await readFile(new URL("../app/api/cart/route.ts", import.meta.url), "utf8"))
    .replace(/^import .*;$/gm, "") + "\n";
  const prelude = `const env = { DB: globalThis.__cartTestDB }; const atomicRequest = handler => handler;
    const requireApiCustomer = async () => ({ id: 42 }); const ensureCatalog = async () => {};
    const releaseExpiredUniqueReservations = async () => {};\n`;
  globalThis.__cartTestDB = database;
  try {
    const js = ts.transpileModule(prelude + source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    const route = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}#${crypto.randomUUID()}`);
    return { items, route };
  } finally { delete globalThis.__cartTestDB; }
}
const changeSize = () => new Request("http://localhost/api/cart", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId: 1, nextVariantId: 2, quantity: 1 }) });

test("changing a bag size preserves quantity and merges an existing target size", async () => {
  const { items, route } = await cartRoute();
  assert.equal((await route.PATCH(changeSize())).status, 200);
  assert.deepEqual([...items], [[2, 3]]);
});

test("an unavailable replacement size leaves the original bag intact", async () => {
  const { items, route } = await cartRoute(2);
  assert.equal((await route.PATCH(changeSize())).status, 409);
  assert.deepEqual([...items], [[1, 2], [2, 1]]);
});
