import type { BookRepositoryPort } from '$lib/server/application/ports/BookRepositoryPort';
import { apiError, apiOk, type ApiResult } from '$lib/server/http/api';

interface UpdateLibraryBookStateInput {
	bookId: number;
	isRead?: boolean;
	excludeFromNewBooks?: boolean;
}

interface UpdateLibraryBookStateResult {
	success: true;
	bookId: number;
	isRead: boolean;
	readAt: string | null;
	progressPercent: number | null;
	excludeFromNewBooks: boolean;
}

export class UpdateLibraryBookStateUseCase {
	constructor(private readonly bookRepository: BookRepositoryPort) {}

	async execute(input: UpdateLibraryBookStateInput): Promise<ApiResult<UpdateLibraryBookStateResult>> {
		if (input.isRead === undefined && input.excludeFromNewBooks === undefined) {
			return apiError('At least one field (isRead or excludeFromNewBooks) must be provided', 400);
		}

		const book = await this.bookRepository.getById(input.bookId);
		if (!book) {
			return apiError('Book not found', 404);
		}

		const nextReadAt =
			input.isRead === undefined
				? book.read_at
				: input.isRead
					? book.read_at ?? new Date().toISOString()
					: null;
		const shouldStoreProgressBeforeRead =
			input.isRead === true &&
			(book.read_at === null) &&
			typeof book.progress_percent === 'number' &&
			book.progress_percent > 0 &&
			book.progress_percent < 1;
		const nextProgressBeforeRead =
			input.isRead === undefined
				? book.progress_before_read
				: input.isRead
					? shouldStoreProgressBeforeRead
						? book.progress_percent
						: book.progress_before_read
					: null;
		const nextProgressPercent =
			input.isRead === undefined
				? book.progress_percent
				: input.isRead
					? 1
					: book.progress_before_read ?? null;

		const nextExclude =
			input.excludeFromNewBooks === undefined
				? book.exclude_from_new_books
				: input.excludeFromNewBooks;

		await this.bookRepository.updateState(input.bookId, {
			readAt: nextReadAt,
			progressPercent: nextProgressPercent,
			progressBeforeRead: nextProgressBeforeRead,
			excludeFromNewBooks: nextExclude
		});

		return apiOk({
			success: true,
			bookId: input.bookId,
			isRead: nextReadAt !== null,
			readAt: nextReadAt,
			progressPercent: nextProgressPercent,
			excludeFromNewBooks: nextExclude
		});
	}
}
