import { ZLibrary } from '$lib/server/application/ZLibrary';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");



// -------------------------------
// GET /api/zlibrary/download
// -------------------------------
export const GET: RequestHandler = async ({ request, locals }) => {
    const r: ZSearchBookRequest = {
        searchText: "Harry Potter and the Goblet of Fire",
        limit: 1
    };

    if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 400 });
	}
    
    try {

        var loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);
        var response = await zlib.search(r);

        var dlRes = await zlib.download(response.books[0].id.toString(), response.books[0].hash);
        var buffer = await dlRes.arrayBuffer();

		return new Response(buffer, {
			headers: dlRes.headers
		});

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


