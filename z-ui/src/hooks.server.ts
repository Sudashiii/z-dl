import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { requireBasicAuth } from '$lib/server/auth/basicAuth';
import { errorResponse } from '$lib/server/http/api';
import { purgeExpiredTrashUseCase } from '$lib/server/application/composition';

const TRASH_PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastTrashPurgeStartedAt = 0;
let runningPurgePromise: Promise<void> | null = null;

function triggerTrashPurgeIfDue(): void {
	const now = Date.now();
	if (runningPurgePromise) {
		return;
	}

	if (now - lastTrashPurgeStartedAt < TRASH_PURGE_INTERVAL_MS) {
		return;
	}

	lastTrashPurgeStartedAt = now;
	runningPurgePromise = (async () => {
		try {
			const result = await purgeExpiredTrashUseCase.execute();
			if (!result.ok) {
				console.error('Trash purge failed:', result.error.message);
			} else if (result.value.purgedBookIds.length > 0) {
				console.info(`Purged ${result.value.purgedBookIds.length} expired trashed book(s)`);
			}
		} catch (err: unknown) {
			console.error('Trash purge failed:', err);
		} finally {
			runningPurgePromise = null;
		}
	})();
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
	triggerTrashPurgeIfDue();

	const userId = event.cookies.get('userId');
	const userKey = event.cookies.get('userKey');

	if (userId && userKey) {
		event.locals.zuser = { userId, userKey }; 
	}

	return resolve(event);
};
export const handle = sequence(cookieHandle, basicAuthHandle);
