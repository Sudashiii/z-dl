import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { ZLibraryCredentials, ZLibraryPort } from '$lib/server/application/ports/ZLibraryPort';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';
import type { ZSearchBookRequest } from '$lib/types/ZLibrary/Requests/ZSearchBookRequest';
import type { ZBook } from '$lib/types/ZLibrary/ZBook';

interface RefetchLibraryBookMetadataInput {
	bookId: number;
	credentials: ZLibraryCredentials;
}

interface RefetchLibraryBookMetadataResult {
	success: true;
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

function normalizeText(value: string | null | undefined): string {
	return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function selectBestMatch(source: {
	zLibId: string | null;
	title: string;
	author: string | null;
}, candidates: ZBook[]): ZBook | undefined {
	if (source.zLibId) {
		const byId = candidates.find((candidate) => String(candidate.id) === source.zLibId);
		if (byId) {
			return byId;
		}
	}

	const targetTitle = normalizeText(source.title);
	const targetAuthor = normalizeText(source.author);

	const exactTitleAndAuthor = candidates.find((candidate) => {
		return normalizeText(candidate.title) === targetTitle &&
			targetAuthor.length > 0 &&
			normalizeText(candidate.author) === targetAuthor;
	});
	if (exactTitleAndAuthor) {
		return exactTitleAndAuthor;
	}

	const exactTitle = candidates.find((candidate) => normalizeText(candidate.title) === targetTitle);
	if (exactTitle) {
		return exactTitle;
	}

	return candidates[0];
}

export class RefetchLibraryBookMetadataUseCase {
	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly zlibrary: ZLibraryPort
	) {}

	async execute(
		input: RefetchLibraryBookMetadataInput
	): Promise<ApiResult<RefetchLibraryBookMetadataResult>> {
		const existingBook = await this.bookRepository.getById(input.bookId);
		if (!existingBook) {
			return apiError('Book not found', 404);
		}

		const loginResult = await this.zlibrary.tokenLogin(input.credentials.userId, input.credentials.userKey);
		if (!loginResult.ok) {
			return loginResult;
		}

		const searchRequest: ZSearchBookRequest = {
			searchText: existingBook.title,
			limit: 20
		};
		const searchResult = await this.zlibrary.search(searchRequest);
		if (!searchResult.ok) {
			return searchResult;
		}

		const matchedBook = selectBestMatch(existingBook, searchResult.value.books);
		if (!matchedBook) {
			return apiError('No matching metadata found in Z-Library', 404);
		}

		const updated = await this.bookRepository.updateMetadata(existingBook.id, {
			zLibId: String(matchedBook.id),
			title: matchedBook.title,
			author: matchedBook.author ?? null,
			cover: matchedBook.cover ?? null,
			extension: matchedBook.extension ?? null,
			filesize: matchedBook.filesize ?? null,
			language: matchedBook.language ?? null,
			year: matchedBook.year ?? null
		});

		return apiOk({
			success: true,
			book: {
				id: updated.id,
				zLibId: updated.zLibId,
				title: updated.title,
				author: updated.author,
				cover: updated.cover,
				extension: updated.extension,
				filesize: updated.filesize,
				language: updated.language,
				year: updated.year
			}
		});
	}
}
