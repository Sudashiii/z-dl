import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const books = await BookRepository.getAll();
		return json({ success: true, books });
	} catch (err: unknown) {
		console.error('Failed to fetch library books:', err);
		return json({ success: false, error: 'Failed to fetch library books' }, { status: 500 });
	}
};
