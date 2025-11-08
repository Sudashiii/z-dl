import { DeviceDownloadRepository } from '$lib/server/infrastructure/repositories/DeviceDownloadRepository';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { deviceId, bookId } = body;

	// Validate input
	if (!deviceId || typeof bookId !== 'number') {
		return new Response(JSON.stringify({ error: 'deviceId and bookId are required' }), {
			status: 400
		});
	}

	// Create new download entry
	const download = await DeviceDownloadRepository.create({ deviceId, bookId });

	return new Response(JSON.stringify(download), {
		status: 201,
		headers: { 'Content-Type': 'application/json' }
	});
};
