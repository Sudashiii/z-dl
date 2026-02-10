import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import { generateAuthHeader } from '../base/authHeader';

export async function removeLibraryBookDeviceDownload(
	bookId: number,
	deviceId: string
): Promise<Result<void, ApiError>> {
	const authResult = generateAuthHeader();
	if (!authResult.ok) {
		return err(authResult.error);
	}

	try {
		const res = await fetch(`/api/library/${bookId}/downloads/${encodeURIComponent(deviceId)}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: authResult.value
			}
		});

		if (!res.ok) {
			return err(await ApiErrors.fromResponse(res));
		}

		return ok(undefined);
	} catch (error) {
		return err(ApiErrors.network('Network request failed', error));
	}
}
