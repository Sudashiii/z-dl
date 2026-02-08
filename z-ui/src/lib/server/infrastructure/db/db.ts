import { createClient } from '@libsql/client';
import { TURSO_DB_URL, TURSO_DB_AUTH_TOKEN } from '$env/static/private';

export const db = createClient({
	url: TURSO_DB_URL,
	authToken: TURSO_DB_AUTH_TOKEN
});
