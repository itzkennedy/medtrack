/**
 * db.js — Postgres connection pool via pg.
 * Reads DATABASE_URL from environment variables loaded by dotenv.
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
