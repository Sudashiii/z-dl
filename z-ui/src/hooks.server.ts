import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { requireBasicAuth } from '$lib/server/auth/basicAuth';
import { errorResponse } from '$lib/server/http/api';
import {
	purgeExpiredTrashUseCase,
	syncKoreaderPluginReleaseUseCase
} from '$lib/server/application/composition';
import { createChildLogger, toLogError } from '$lib/server/infrastructure/logging/logger';
import { randomUUID } from 'node:crypto';

const TRASH_PURGE_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastTrashPurgeStartedAt = 0;
let runningPurgePromise: Promise<void> | null = null;
let pluginSyncStarted = false;

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
		const purgeLogger = createChildLogger({ event: 'trash.purge' });
		try {
			const result = await purgeExpiredTrashUseCase.execute();
			if (!result.ok) {
				purgeLogger.error({ error: result.error }, 'Trash purge failed');
			} else if (result.value.purgedBookIds.length > 0) {
				purgeLogger.info(
					{ purgedBookIds: result.value.purgedBookIds, count: result.value.purgedBookIds.length },
					'Purged expired trashed books'
				);
			}
		} catch (err: unknown) {
			purgeLogger.error({ error: toLogError(err) }, 'Trash purge failed');
		} finally {
			runningPurgePromise = null;
		}
	})();
}

function triggerPluginSyncOnStartup(): void {
	if (pluginSyncStarted) {
		return;
	}

	pluginSyncStarted = true;
	void (async () => {
		const pluginLogger = createChildLogger({ event: 'plugin.sync.startup' });
		try {
			const result = await syncKoreaderPluginReleaseUseCase.execute();
			if (!result.ok) {
				pluginLogger.error(
					{ statusCode: result.error.status, reason: result.error.message },
					'KOReader plugin startup sync rejected'
				);
				return;
			}

			pluginLogger.info(
				{
					version: result.value.version,
					storageKey: result.value.storageKey,
					uploaded: result.value.uploaded
				},
				'KOReader plugin startup sync finished'
			);
		} catch (err: unknown) {
			pluginLogger.error({ error: toLogError(err) }, 'KOReader plugin startup sync failed');
		}
	})();
}

triggerPluginSyncOnStartup();

const requestLogHandle: Handle = async ({ event, resolve }) => {
	const requestId = randomUUID();
	const start = Date.now();
	const requestLogger = createChildLogger({
		requestId,
		method: event.request.method,
		route: event.url.pathname
	});

	event.locals.requestId = requestId;
	event.locals.logger = requestLogger;

	requestLogger.info({ event: 'request.start' }, 'Request started');

	try {
		const response = await resolve(event);
		const durationMs = Date.now() - start;
		response.headers.set('x-request-id', requestId);
		requestLogger.info(
			{
				event: 'request.finish',
				statusCode: response.status,
				durationMs
			},
			'Request completed'
		);
		return response;
	} catch (err: unknown) {
		requestLogger.error(
			{
				event: 'request.error',
				durationMs: Date.now() - start,
				error: toLogError(err)
			},
			'Request failed'
		);
		throw err;
	}
};

const basicAuthHandle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;

	if (url.pathname.startsWith('/api/')) {
		try {
			requireBasicAuth(request);
		} catch (err) {
				if (err instanceof Response) {
					event.locals.logger?.warn(
						{ event: 'auth.denied', statusCode: err.status },
						'Basic auth denied'
					);
					return err;
				}
				event.locals.logger?.error({ event: 'auth.error', error: toLogError(err) }, 'Auth error');
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
export const handle = sequence(requestLogHandle, cookieHandle, basicAuthHandle);
