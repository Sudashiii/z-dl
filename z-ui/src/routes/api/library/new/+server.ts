import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';


export const GET: RequestHandler = async ({ url }) => {
	const deviceId = url.searchParams.get('deviceId');

	if (!deviceId) {
		return new Response(JSON.stringify({ error: 'Missing deviceId parameter' }), { status: 400 });
	}

	const books = await BookRepository.getNotDownloadedByDevice(deviceId);
	return new Response(JSON.stringify(books), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
