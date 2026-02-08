import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import { apiOk, type ApiResult } from '$lib/server/http/api';
import type { Book } from '$lib/server/domain/entities/Book';

interface ListLibraryResult {
	success: true;
	books: Book[];
}

export class ListLibraryUseCase {
	constructor(private readonly bookRepository: BookRepositoryPort) {}

	async execute(): Promise<ApiResult<ListLibraryResult>> {
		const books = await this.bookRepository.getAll();
		return apiOk({ success: true, books });
	}
}
