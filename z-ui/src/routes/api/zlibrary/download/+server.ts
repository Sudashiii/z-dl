import { ZLibrary } from '$lib/server/application/ZLibrary';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");

// -------------------------------
// GET /api/zlibrary/download
// -------------------------------
export const GET: RequestHandler = async ({ request, locals, url }) => {

    if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 400 });
	}
    
    const bookId = url.searchParams.get('bookId');
    const hash = url.searchParams.get('hash');

    if(!bookId || !hash) {
        return json({ error: 'Missing bookId or hash parameter' }, { status: 400 });
    }

    try {

        var loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);

        if(!loggedIn) {
            return json({ error: 'Z-Lib Login failed' }, { status: 401 });
        }

        var bookDownloadResponse = await zlib.download(bookId, hash);
        var fileBuffer = await bookDownloadResponse.arrayBuffer();

		return new Response(fileBuffer, {
			headers: bookDownloadResponse.headers
		});

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


