// -------------------------------
// GET /api/zlibrary/logout
// -------------------------------
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const response = new Response(JSON.stringify({ success: true }), { status: 200 });

		response.headers.append(
			'Set-Cookie',
			'userId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
		);
		response.headers.append(
			'Set-Cookie',
			'userKey=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
		);

		return response;
	} catch (err: any) {
		console.error(err);
		return json({ error: 'Logout failed' }, { status: 500 });
	}
};
