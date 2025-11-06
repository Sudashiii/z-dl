import { ZLibrary } from '$lib/server/application/ZLibrary';
import { mimeTypes } from '$lib/server/constants/mimeTypes';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");

// -------------------------------
// GET /api/zlibrary/search
// -------------------------------
export const POST: RequestHandler = async ({ request, locals }) => {

	const body = (await request.json()) as ZSearchBookRequest;
	if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 409 });
	}

    try {

        var loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);

        if(!loggedIn) {
            return json({ error: 'Z-Lib Login failed' }, { status: 401 });
        }

        var response = await zlib.search(body);

        return json(response.books);

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


