import { zlibraryTokenLoginUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { ZTokenLoginRequest } from '$lib/types/ZLibrary/Requests/ZTokenLoginRequest';
import type { RequestHandler } from '@sveltejs/kit';

// -------------------------------
// POST /api/zlibrary/login
// -------------------------------
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ZTokenLoginRequest;

	try {
			const loginResult = await zlibraryTokenLoginUseCase.execute(body);
		if (!loginResult.ok) {
			return errorResponse(loginResult.error.message, loginResult.error.status);
		}

		const response = new Response(JSON.stringify({ success: true }), { status: 200 });
		response.headers.append(
			'Set-Cookie',
			`userId=${loginResult.value.userId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);
		response.headers.append(
			'Set-Cookie',
			`userKey=${loginResult.value.userKey}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);

		return response;
	} catch (err: unknown) {
		console.error(err);
		return errorResponse('Z-Library login failed', 500);
	}
};
