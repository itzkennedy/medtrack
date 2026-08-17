/**
 * db-init.js — runs schema.sql against local MySQL.
 * Usage: npm run db:init  (from /server)
 *
 * Reads .env for connection details, then executes ../db/schema.sql.
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // Create database if it doesn't exist
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  // Read and execute schema
  const schemaPath = path.join(__dirname, "../../db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");

  // Split on semicolons and execute each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await conn.query(stmt);
  }

  console.log("Database initialized successfully.");
  await conn.end();
}

init().catch((err) => {
  console.error("Failed to initialize database:", err.message);
  process.exit(1);
});
