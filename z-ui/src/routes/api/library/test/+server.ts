import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';
import { db, initializeDatabase } from '$lib/server/infrastructure/db/db';

export const GET: RequestHandler = async ({ url }) => {
    
    const b = await BookRepository.getAll();

    return new Response(JSON.stringify(b), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
