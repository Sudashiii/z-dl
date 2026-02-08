import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { requireBasicAuth } from '$lib/server/auth/basicAuth';
import { initializeDatabase } from '$lib/server/infrastructure/db/db';
import { errorResponse } from '$lib/server/http/api';

const basicAuthHandle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;

	if (url.pathname.startsWith('/api/')) {
		try {
			requireBasicAuth(request);
		} catch (err) {
				if (err instanceof Response) {
					return err;
				}
				console.error('Auth error:', err);
				return errorResponse('Authentication error', 500);
			}
		}

	return resolve(event);
};

const cookieHandle: Handle = async ({ event, resolve }) => {
	const userId = event.cookies.get('userId');
	const userKey = event.cookies.get('userKey');

	if (userId && userKey) {
		event.locals.zuser = { userId, userKey }; 
	}

	return resolve(event);
};

await initializeDatabase();
export const handle = sequence(cookieHandle, basicAuthHandle);
