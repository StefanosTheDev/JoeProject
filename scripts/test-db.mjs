#!/usr/bin/env node
/**
 * Test that PostgreSQL is reachable and Prisma can connect.
 * Loads .env.local if present. Run: npm run test:db
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env.local into process.env (simple parser, no dotenv dep)
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Add it to .env.local (see .env.example).");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection OK (Prisma + PostgreSQL)");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    if (err.message.includes("denied access") || err.message.includes("(not available)")) {
      console.error("\nTip: Check that the database in DATABASE_URL exists and the user has access.");
      console.error("  - Local: create the DB with createdb <dbname> or in psql.");
      console.error("  - Hosted (Neon/Vercel/Railway): use the connection string from the dashboard.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
