import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { S3Storage } from '$lib/server/application/S3Storage';
import { mimeTypes } from '$lib/server/constants/mimeTypes';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

const s3 = new S3Storage();

function extractSummaryModified(content: string): string | null {
	const match = content.match(/\["summary"\][\s\S]*?\["modified"\]\s*=\s*"(\d{4}-\d{2}-\d{2})"/);
	return match?.[1] ?? null;
}

function buildProgressKey(title: string) {
	const lastDot = title.lastIndexOf('.');
	if (lastDot <= 0 || lastDot === title.length - 1) {
		throw new Error('Invalid title format. Expected filename with extension.');
	}

	const extension = title.slice(lastDot + 1);
	const baseName = title.slice(0, lastDot);
	const metadataFileName = `metadata.${extension}.lua`;
	const progressKey = `${baseName}.sdr/${metadataFileName}`;

	return { progressKey, metadataFileName, extension, baseName };
}

async function resolveBook(targetTitle: string) {
	const { baseName, extension } = buildProgressKey(targetTitle);
	const bookByStorageKey = await BookRepository.getByStorageKey(targetTitle);
	const bookByTitleAndExtension = await BookRepository.getByTitleAndExtension(baseName, extension);
	const bookByTitle = await BookRepository.getByTitle(targetTitle);
	const bookByBaseTitle = await BookRepository.getByTitle(baseName);
	return bookByStorageKey ?? bookByTitleAndExtension ?? bookByTitle ?? bookByBaseTitle;
}

// -------------------------------
// GET /api/library/progress?fileName=Book_title.epub
// -------------------------------
export const GET: RequestHandler = async ({ url }) => {
	const targetTitle = url.searchParams.get('fileName');

	if (!targetTitle) {
		return json({ error: 'Missing fileName parameter' }, { status: 400 });
	}

	try {
		const book = await resolveBook(targetTitle);
		const resolved = book ? buildProgressKey(book.s3_storage_key) : buildProgressKey(targetTitle);
		const { progressKey, metadataFileName, extension: progressExtension } = resolved;
		const key = `library/${progressKey}`;
		// @ts-ignore
		const contentType: string = mimeTypes[progressExtension] || mimeTypes.default;

		const data: Buffer<ArrayBufferLike> = await s3.get(key);
		const arrayBuffer = data.buffer as ArrayBuffer;
		return new Response(arrayBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': data.length.toString(),
				'Content-Disposition': `attachment; filename="${metadataFileName}"`
			}
		});
	} catch (err: any) {
		console.error(err);
		return json({ error: 'Progress file not found' }, { status: 404 });
	}
};

// -------------------------------
// PUT /api/library/progress (multipart form-data)
// Fields: fileName, file
// -------------------------------
export const PUT: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const fileName = formData.get('fileName');
		const file = formData.get('file');
		const targetTitle = typeof fileName === 'string' && fileName ? fileName : null;

		if (!targetTitle) {
			return json({ error: 'Missing fileName in form data' }, { status: 400 });
		}

		if (!file || typeof (file as File).arrayBuffer !== 'function') {
			return json({ error: 'Missing file in form data' }, { status: 400 });
		}

		const book = await resolveBook(targetTitle);
		if (!book) {
			return json({ error: 'Book not found' }, { status: 404 });
		}

		const { progressKey } = buildProgressKey(book.s3_storage_key);
		const body = await (file as File).arrayBuffer();
		const incomingText = Buffer.from(body).toString('utf8');
		const incomingLatest = extractSummaryModified(incomingText);

		try {
			const existingKey = `library/${progressKey}`;
			const existingData: Buffer<ArrayBufferLike> = await s3.get(existingKey);
			const existingText = Buffer.from(existingData).toString('utf8');
			const existingLatest = extractSummaryModified(existingText);

			if (existingLatest && incomingLatest && incomingLatest < existingLatest) {
				return json(
					{
						success: false,
						reason: 'Incoming progress is older than stored progress',
						incomingLatest,
						existingLatest
					},
					{ status: 409 }
				);
			}
		} catch (err: any) {
			// Ignore if no existing progress file
		}

		const uploadService = DavUploadServiceFactory.createS3();
		await uploadService.upload(progressKey, Buffer.from(body));

		await BookRepository.updateProgress(book.id, progressKey);

		return json({ success: true, progressKey, incomingLatest });
	} catch (err: any) {
		console.error('Progress upload failed:', err);
		return json({ error: 'Progress upload failed' }, { status: 500 });
	}
};
