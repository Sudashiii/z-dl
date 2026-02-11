import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import type { StoragePort } from '$lib/server/application/ports/StoragePort';
import { extractPercentFinished } from '$lib/server/domain/value-objects/ProgressFile';
import { apiOk, type ApiResult } from '$lib/server/http/api';
import type { Book } from '$lib/server/domain/entities/Book';

interface LibraryBookWithProgress extends Book {
	progressPercent: number | null;
}

interface ListLibraryResult {
	success: true;
	books: LibraryBookWithProgress[];
}

export class ListLibraryUseCase {
	constructor(
		private readonly bookRepository: BookRepositoryPort,
		private readonly storage: StoragePort
	) {}

	private async resolveProgressPercent(book: Book): Promise<number | null> {
		if (!book.progress_storage_key) {
			return null;
		}

		try {
			const content = (await this.storage.get(`library/${book.progress_storage_key}`)).toString('utf8');
			const percentFinished = extractPercentFinished(content);
			if (percentFinished === null) {
				return null;
			}
			return Math.max(0, Math.min(100, percentFinished * 100));
		} catch {
			return null;
		}
	}

	async execute(): Promise<ApiResult<ListLibraryResult>> {
		const books = await this.bookRepository.getAll();
		const withProgress = await Promise.all(
			books.map(async (book) => ({
				...book,
				progressPercent: await this.resolveProgressPercent(book)
			}))
		);
		return apiOk({ success: true, books: withProgress });
	}
}
