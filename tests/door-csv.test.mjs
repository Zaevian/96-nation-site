/**
 * Unit tests for door CSV (Appendix F) — pure helpers in lib/orders/door-csv.ts.
 * Transpiles the TS source in-memory via the project's typescript package.
 *
 * Run: npm run test:unit
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(__dirname, "..", "lib", "orders", "door-csv.ts");
const source = readFileSync(sourcePath, "utf8");

const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  },
  fileName: "door-csv.ts",
});

const outDir = join(tmpdir(), `door-csv-test-${process.pid}`);
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "door-csv.mjs");
writeFileSync(outFile, outputText, "utf8");

const {
  buildDoorCsv,
  csvEscape,
  isOrderStatus,
  neutralizeCsvFormula,
  ORDER_STATUSES,
} = await import(pathToFileURL(outFile).href);

test("buildDoorCsv expands quantity into one row per ticket unit", () => {
  const csv = buildDoorCsv([
    {
      id: "ord-1",
      quantity: 3,
      event_slug: "gala",
      ticket_type_id: "ga",
      buyer_name: "Ada Lovelace",
      buyer_email: "ada@example.com",
      buyer_phone: "+15551234567",
      status: "paid",
      paid_at: "2026-08-01T12:00:00.000Z",
    },
  ]);
  const lines = csv.trimEnd().split("\n");
  assert.equal(lines.length, 4, "header + 3 data rows");
  assert.equal(
    lines[0],
    "order_id,ticket_index,quantity_total,event_slug,ticket_type_id,buyer_name,buyer_email,buyer_phone,status,paid_at",
  );
  assert.ok(lines[1].startsWith("ord-1,1,3,gala,ga,"));
  assert.ok(lines[2].startsWith("ord-1,2,3,gala,ga,"));
  assert.ok(lines[3].startsWith("ord-1,3,3,gala,ga,"));
});

test("buildDoorCsv quantity 1 yields single data row", () => {
  const csv = buildDoorCsv([
    {
      id: "o2",
      quantity: 1,
      event_slug: "e",
      ticket_type_id: "t",
      buyer_name: "B",
      buyer_email: "b@e.com",
      buyer_phone: "+1",
      status: "paid",
      paid_at: null,
    },
  ]);
  assert.equal(csv.trimEnd().split("\n").length, 2);
});

test("csvEscape quotes commas and quotes", () => {
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
});

test("neutralizeCsvFormula prefixes formula-like values", () => {
  assert.equal(neutralizeCsvFormula("=cmd"), "'=cmd");
  assert.equal(neutralizeCsvFormula("+1-555"), "'+1-555");
  assert.equal(neutralizeCsvFormula("-2"), "'-2");
  assert.equal(neutralizeCsvFormula("@sum"), "'@sum");
  assert.equal(neutralizeCsvFormula("Normal Name"), "Normal Name");
});

test("buildDoorCsv formula-neutralizes buyer name", () => {
  const csv = buildDoorCsv([
    {
      id: "o3",
      quantity: 1,
      event_slug: "e",
      ticket_type_id: "t",
      buyer_name: "=1+1",
      buyer_email: "x@y.z",
      buyer_phone: "+1555",
      status: "paid",
      paid_at: null,
    },
  ]);
  const data = csv.trimEnd().split("\n")[1];
  assert.ok(data.includes("'=1+1") || data.includes("\"'=1+1\""));
});

test("isOrderStatus validates enum", () => {
  assert.equal(isOrderStatus("paid"), true);
  assert.equal(isOrderStatus("nope"), false);
  assert.ok(ORDER_STATUSES.includes("pending"));
});

// Cleanup temp transpile output
rmSync(outDir, { recursive: true, force: true });
