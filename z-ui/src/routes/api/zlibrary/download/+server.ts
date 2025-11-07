import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary("https://1lib.sk");

// -------------------------------
// GET /api/zlibrary/download
// -------------------------------
export const POST: RequestHandler = async ({ request, locals, url }) => {
    const body = (await request.json()) as ZDownloadBookRequest;
    const { bookId, hash, upload, title, extension } = body;

    if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 400 });
	}
    
    console.log(url.searchParams);
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
        if(upload) {
            const uploadService = DavUploadServiceFactory.createS3();
            const key = `${title}_${bookId}.${extension}`;
            await uploadService.upload(key, Buffer.from(fileBuffer));
            BookRepository.create({  s3_storage_key: key, title: title });
        }

		return new Response(fileBuffer, {
			headers: bookDownloadResponse.headers
		});

    } catch (err: any) {
        console.error(err);
        return json({ error: 'File not found' }, { status: 404 });
    }
};


