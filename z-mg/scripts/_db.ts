
import { type Client, createClient } from "@libsql/client";
import { loadSync } from "std/dotenv";

const env = loadSync({ export: true });

const url = Deno.env.get("TURSO_DB_URL");
const authToken = Deno.env.get("TURSO_DB_AUTH_TOKEN");

if (!url) {
  console.error("Error: TURSO_DB_URL is not set in .env file.");
  console.log("Please create a .env file based on .env.example");
  Deno.exit(1);
}
if (!authToken) {
  console.error("Error: TURSO_DB_AUTH_TOKEN is not set in .env file.");
  console.log("Please create a .env file based on .env.example");
  Deno.exit(1);
}

export const db: Client = createClient({ url, authToken });

/**
 * Defines the interface that every migration file must implement.
 */
export interface Migration {
  up: (db: Client) => Promise<void>;
  down: (db: Client) => Promise<void>;
}