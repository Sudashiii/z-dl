import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
    const { id } = params;

    if (!id) {
        return json({ error: 'Missing book id' }, { status: 400 });
    }

    try {
        await BookRepository.resetDownloadStatus(Number(id));
        return json({ success: true });
    } catch (err: any) {
        console.error('Failed to reset download status:', err);
        return json({ error: 'Failed to reset download status' }, { status: 500 });
    }
};
