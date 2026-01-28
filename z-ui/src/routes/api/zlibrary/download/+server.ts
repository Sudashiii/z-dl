import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const zlib = new ZLibrary('https://1lib.sk');

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = (await request.json()) as ZDownloadBookRequest;
	const { bookId, hash, upload, title, extension, author, cover, filesize, language, year, downloadToDevice } = body;

	if (!locals.zuser) {
		return json({ error: 'ZLib Login is not valid!' }, { status: 400 });
	}

	if (!bookId || !hash) {
		return json({ error: 'Missing bookId or hash parameter' }, { status: 400 });
	}

	try {
		const loggedIn = await zlib.tokenLogin(locals.zuser.userId, locals.zuser.userKey);

		if (!loggedIn) {
			return json({ error: 'Z-Lib Login failed' }, { status: 401 });
		}

		const bookDownloadResponse = await zlib.download(bookId, hash);
		const fileBuffer = await bookDownloadResponse.arrayBuffer();

		if (upload) {
			const uploadService = DavUploadServiceFactory.createS3();
			const key = `${title}_${bookId}.${extension}`;
			await uploadService.upload(key, Buffer.from(fileBuffer));

			await BookRepository.create({
				zLibId: bookId,
				s3_storage_key: key,
				title: title,
				author: author ?? null,
				cover: cover ?? null,
				extension: extension ?? null,
				filesize: filesize ?? null,
				language: language ?? null,
				year: year ?? null,
				isDownloaded: (downloadToDevice !== false) // Mark as downloaded if we are sending to device
			});
		}

		if (downloadToDevice === false) {
			return json({ success: true });
		}

		return new Response(fileBuffer, {
			headers: bookDownloadResponse.headers
		});
	} catch (err: unknown) {
		console.error(err);
		return json({ error: 'File not found' }, { status: 404 });
	}
};
