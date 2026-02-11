import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { requireBasicAuth } from '$lib/server/auth/basicAuth';
import { errorResponse } from '$lib/server/http/api';
import { purgeExpiredTrashUseCase } from '$lib/server/application/composition';

let purgeStarted = false;
let purgePromise: Promise<void> | null = null;

function ensureTrashPurgeStarted(): Promise<void> {
	if (purgeStarted) {
		return purgePromise ?? Promise.resolve();
	}

	purgeStarted = true;
	purgePromise = (async () => {
		try {
			const result = await purgeExpiredTrashUseCase.execute();
			if (!result.ok) {
				console.error('Trash purge failed:', result.error.message);
			} else if (result.value.purgedBookIds.length > 0) {
				console.info(`Purged ${result.value.purgedBookIds.length} expired trashed book(s)`);
			}
		} catch (err: unknown) {
			console.error('Trash purge failed:', err);
		}
	})();

	return purgePromise;
}

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
	await ensureTrashPurgeStarted();

	const userId = event.cookies.get('userId');
	const userKey = event.cookies.get('userKey');

	if (userId && userKey) {
		event.locals.zuser = { userId, userKey }; 
	}

	return resolve(event);
};
export const handle = sequence(cookieHandle, basicAuthHandle);
