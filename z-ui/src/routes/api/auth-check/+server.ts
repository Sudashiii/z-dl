// -------------------------------
// GET /api/auth-check
// -------------------------------
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	return json({ success: true }, { status: 200 });
};
