import type { Config } from 'drizzle-kit';

if (!process.env.TURSO_DB_URL) {
	throw new Error('Missing TURSO_DB_URL');
}

if (!process.env.TURSO_DB_AUTH_TOKEN) {
	throw new Error('Missing TURSO_DB_AUTH_TOKEN');
}

export default {
	schema: './src/lib/server/infrastructure/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.TURSO_DB_URL,
		authToken: process.env.TURSO_DB_AUTH_TOKEN
	}
} satisfies Config;
