import { ZLibrary } from '$lib/server/application/ZLibrary';
import type { ZTokenLoginRequest } from '$lib/types/ZLibrary/Requests/ZTokenLoginRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");

// -------------------------------
// GET /api/zlibrary/login
// -------------------------------
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ZTokenLoginRequest;

    try {

        var loggedIn = await zlib.tokenLogin(body.userId, body.userKey);

        if(!loggedIn) {
            return json({ error: 'Z-Lib Login failed' }, { status: 401 });
        }

		const response = new Response(JSON.stringify({ success: true }), { status: 200 });
		response.headers.append(
			'Set-Cookie',
			`userId=${body.userId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);
		response.headers.append(
			'Set-Cookie',
			`userKey=${body.userKey}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);

		return response;

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


