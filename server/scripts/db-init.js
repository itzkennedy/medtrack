/**
 * db-init.js — runs schema.sql against Supabase Postgres.
 * Usage: npm run db:init  (from /server)
 *
 * Reads DATABASE_URL from .env, then executes ../db/schema.sql.
 */

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function init() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const schemaPath = path.join(__dirname, "../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(sql);

  console.log("Database initialized successfully.");
  await pool.end();
}

init().catch((err) => {
  console.error("Failed to initialize database:", err.message);
  process.exit(1);
});
