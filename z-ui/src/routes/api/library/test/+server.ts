import type { RequestHandler } from '@sveltejs/kit';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';

const zlib = new ZLibrary("https://1lib.sk");

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ZLoginRequest;

    zlib.passwordLogin(body.email, body.password);

    return new Response(JSON.stringify("1"), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
