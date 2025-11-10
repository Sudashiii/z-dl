import { createClient, Client } from '@libsql/client';

/**
 * Creates and configures the LibSQL database client.
 * @returns {Client} The LibSQL client instance.
 */
export function getDbClient(): Client {
  const url = process.env.DB_URL;
  const authToken = process.env.DB_AUTH_TOKEN;

  if (!url) {
    throw new Error("DB_URL is not set in the environment variables.");
  }

  return createClient({
    url: url,
    authToken: authToken,
  });
}