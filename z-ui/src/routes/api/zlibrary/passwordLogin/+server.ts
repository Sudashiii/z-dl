import { ZLibrary } from '$lib/server/application/ZLibrary';
import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");

// -------------------------------
// GET /api/zlibrary/login
// -------------------------------
export const POST: RequestHandler = async ({ request }) => {
    const body = (await request.json()) as ZLoginRequest;

    try {

        var userResponse = await zlib.passwordLogin(body.email, body.password);

        const response = new Response(JSON.stringify(userResponse), { status: 200 });

        response.headers.append(
            'Set-Cookie',
            `userId=${userResponse.user.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
        );
        response.headers.append(
            'Set-Cookie',
            `userKey=${userResponse.user.remix_userkey}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
        );

        return response;

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


