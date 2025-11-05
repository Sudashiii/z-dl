import { S3Storage } from '$lib/server/application/S3Storage';
import { mimeTypes } from '$lib/server/constants/mimeTypes';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const s3 = new S3Storage();

// -------------------------------
// GET /api/library/:title
// -------------------------------
export const GET: RequestHandler = async ({ params }) => {
	const { title } = params;

	const key = `library/${title}`;
    const extension = key.split(".").pop()?.toLowerCase() || "default";
	//@ts-ignore
    const contentType: string = mimeTypes[extension] || mimeTypes.default;

	try {
		const data: Buffer<ArrayBufferLike> = await s3.get(key);
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
	const key = `library/${title}`;

	try {
		// Read the binary body from the request
		const body = await request.arrayBuffer();

		// Detect MIME type (optional but nice for R2 / S3 metadata)
		const extension = key.split('.').pop()?.toLowerCase() || 'default';
		const contentType: string = mimeTypes[extension] || mimeTypes.default;

		await s3.put(key, Buffer.from(body), contentType);

		return json({ success: true, key });
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