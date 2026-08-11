import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const seedFile = path.resolve(process.cwd(), "scripts/seed.ts");

if (!fs.existsSync(seedFile)) {
  console.error("Seed aborted: scripts/seed.ts was not found.");
  process.exit(1);
}

let content: string;
try {
  content = fs.readFileSync(seedFile, "utf-8");
} catch (err) {
  console.error("Seed aborted: could not read scripts/seed.ts.", err);
  process.exit(1);
}

// Guard against destructive operations. Seeding must be idempotent and additive
// only, because the same database may be shared across dev/deploy environments.
const forbiddenPatterns: Array<[RegExp, string]> = [
  [/prisma\.\w+\.delete\(/, "prisma.delete"],
  [/prisma\.\w+\.deleteMany\(/, "prisma.deleteMany"],
  [/\$executeRaw/i, "$executeRaw (raw SQL)"],
  [/\bTRUNCATE\b/i, "TRUNCATE"],
  [/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i, "DROP"],
];

const violations = forbiddenPatterns.filter(([pattern]) => pattern.test(content));

if (violations.length > 0) {
  console.error("Seed aborted: scripts/seed.ts contains destructive operations:");
  for (const [, label] of violations) console.error(`  - ${label}`);
  console.error("Seeding must be idempotent and non-destructive (upserts only).");
  console.error("Do not modify this file to bypass this check: dev and deploy databases can be shared.");
  process.exit(1);
}

console.log("[safe-seed] Guard passed - running seed (idempotent, non-destructive).");
execSync("tsx --require dotenv/config scripts/seed.ts", { stdio: "inherit" });