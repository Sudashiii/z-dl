import { zlibraryPasswordLoginUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { ZLoginRequest } from '$lib/types/ZLibrary/Requests/ZLoginRequest';
import type { RequestHandler } from '@sveltejs/kit';

// -------------------------------
// POST /api/zlibrary/passwordLogin
// -------------------------------
export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as ZLoginRequest;

	try {
			const userResponse = await zlibraryPasswordLoginUseCase.execute(body);
		if (!userResponse.ok) {
			return errorResponse(userResponse.error.message, userResponse.error.status);
		}

		const response = new Response(JSON.stringify(userResponse.value), { status: 200 });

		response.headers.append(
			'Set-Cookie',
			`userId=${userResponse.value.user.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);
		response.headers.append(
			'Set-Cookie',
			`userKey=${userResponse.value.user.remix_userkey}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`
		);

		return response;
	} catch (err: unknown) {
		console.error(err);
		return errorResponse('Password login failed', 500);
	}
};
