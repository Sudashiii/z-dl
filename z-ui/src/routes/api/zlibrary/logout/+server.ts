// -------------------------------
// GET /api/zlibrary/logout
// -------------------------------
import { zlibraryLogoutUseCase } from '$lib/server/application/composition';
import { errorResponse } from '$lib/server/http/api';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
			const logoutResult = await zlibraryLogoutUseCase.execute();
		if (!logoutResult.ok) {
			return errorResponse(logoutResult.error.message, logoutResult.error.status);
		}

		const response = new Response(JSON.stringify(logoutResult.value), { status: 200 });

		response.headers.append(
			'Set-Cookie',
			'userId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
		);
		response.headers.append(
			'Set-Cookie',
			'userKey=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
		);

		return response;
	} catch (err: any) {
		console.error(err);
		return errorResponse('Logout failed', 500);
	}
};
