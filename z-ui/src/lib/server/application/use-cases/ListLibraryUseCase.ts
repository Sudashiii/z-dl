import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
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
	constructor(private readonly bookRepository: BookRepositoryPort) {}

	async execute(): Promise<ApiResult<ListLibraryResult>> {
		const books = await this.bookRepository.getAll();
		const withProgress = books.map((book: Book) => ({
			...book,
			progressPercent:
				typeof book.progress_percent === 'number'
					? Math.max(0, Math.min(100, book.progress_percent * 100))
					: null
		}));
		return apiOk({ success: true, books: withProgress });
	}
}
