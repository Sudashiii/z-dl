import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { S3Storage } from '$lib/server/application/S3Storage';
import { mimeTypes } from '$lib/server/constants/mimeTypes';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const s3 = new S3Storage();

// -------------------------------
// GET /api/library/:title
// -------------------------------
export const GET: RequestHandler = async ({ params }) => {
	const { title } = params;
	console.log("Fetching title:", title);
	const key = `library/${title}`;
    const extension = key.split(".").pop()?.toLowerCase() || "default";
	//@ts-ignore
    const contentType: string = mimeTypes[extension] || mimeTypes.default;

	try {
		const data: Buffer<ArrayBufferLike> = await s3.get(key);
		console.log("Fetching data of length: ", data.length.toString());

		const arrayBuffer = data.buffer as ArrayBuffer;
		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': data.length.toString()
			}
		});
	} catch (err: any) {
		console.error(err);
		return json({ error: 'File not found' }, { status: 404 });
	}
};


// -------------------------------
// PUT /api/library/:title
// -------------------------------
export const PUT: RequestHandler = async ({ params, request }) => {
	const { title } = params;

	if(!title) {
		return json({ error: 'Missing title parameter' }, { status: 400 });
	}

	try {
		// Read the binary body from the request
		const body = await request.arrayBuffer();

		const uploadService = DavUploadServiceFactory.createS3();
		await uploadService.upload(title, Buffer.from(body));
		await BookRepository.create({
			s3_storage_key: title,
			title: title,
			zLibId: "000000",
			author: null,
			cover: null,
			extension: null,
			filesize: null,
			language: null,
			year: null
		});
		
		return json({ success: true });
	} catch (err: any) {
		console.error('Upload failed:', err);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};

// -------------------------------
// DELETE /api/library/:title
// -------------------------------
export const DELETE: RequestHandler = async ({ params }) => {
	const { title } = params;
	const key = `library/${title}`;

	try {
		await s3.delete(key);

		return json({
			success: true,
			deleted: key
		});
	} catch (err: any) {
		console.error('Delete failed:', err);
		return json({ error: 'Delete failed' }, { status: 500 });
	}
};