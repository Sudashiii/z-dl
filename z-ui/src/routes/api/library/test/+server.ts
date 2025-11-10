import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import type { RequestHandler } from '@sveltejs/kit';
import { db, initializeDatabase } from '$lib/server/infrastructure/db/db';

export const GET: RequestHandler = async ({ url }) => {
    
    await initializeDatabase();
    //const b = await BookRepository.getAll();

    return new Response(JSON.stringify("1"), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
