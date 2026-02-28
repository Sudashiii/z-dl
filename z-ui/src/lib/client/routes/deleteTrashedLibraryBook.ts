import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import { generateAuthHeader } from '../base/authHeader';

interface DeleteTrashedLibraryBookResponse {
	success: boolean;
	bookId: number;
}

export async function deleteTrashedLibraryBook(
	bookId: number
): Promise<Result<DeleteTrashedLibraryBookResponse, ApiError>> {
	const authResult = generateAuthHeader();
	if (!authResult.ok) {
		return err(authResult.error);
	}

	try {
		const response = await fetch(`/api/library/${bookId}/trash`, {
			method: 'DELETE',
			headers: {
				Authorization: authResult.value
			}
		});

		if (!response.ok) {
			return err(await ApiErrors.fromResponse(response));
		}

		const data: DeleteTrashedLibraryBookResponse = await response.json();
		return ok(data);
	} catch (cause) {
		return err(ApiErrors.network('Network request failed', cause));
	}
}
