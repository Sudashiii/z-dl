import { type Result, ok, err } from '$lib/types/Result';
import { ApiErrors, type ApiError } from '$lib/types/ApiError';
import { post } from '../base/post';

export interface RefetchLibraryBookMetadataResponse {
	success: boolean;
	book: {
		id: number;
		zLibId: string | null;
		title: string;
		author: string | null;
		cover: string | null;
		extension: string | null;
		filesize: number | null;
		language: string | null;
		year: number | null;
	};
}

export async function refetchLibraryBookMetadata(
	bookId: number
): Promise<Result<RefetchLibraryBookMetadataResponse, ApiError>> {
	const result = await post(`/library/${bookId}/refetch-metadata`, '{}');
	if (!result.ok) {
		return err(result.error);
	}

	try {
		const data: RefetchLibraryBookMetadataResponse = await result.value.json();
		return ok(data);
	} catch {
		return err(ApiErrors.server('Failed to parse refetch metadata response', 500));
	}
}
