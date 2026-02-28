import type { BookProgressHistoryRepositoryPort } from '$lib/server/application/ports/BookProgressHistoryRepositoryPort';
import type { BookProgressHistory } from '$lib/server/domain/entities/BookProgressHistory';
import { drizzleDb } from '$lib/server/infrastructure/db/client';
import { bookProgressHistory } from '$lib/server/infrastructure/db/schema';
import { createChildLogger } from '$lib/server/infrastructure/logging/logger';
import { desc, eq } from 'drizzle-orm';

export class BookProgressHistoryRepository implements BookProgressHistoryRepositoryPort {
	private readonly repoLogger = createChildLogger({ repository: 'BookProgressHistoryRepository' });

	async appendSnapshot(
		input: Omit<BookProgressHistory, 'id' | 'recordedAt'>
	): Promise<BookProgressHistory> {
		const [created] = await drizzleDb
			.insert(bookProgressHistory)
			.values({
				bookId: input.bookId,
				progressPercent: input.progressPercent,
				recordedAt: new Date().toISOString()
			})
			.returning();

		if (!created) {
			throw new Error('Failed to append progress history snapshot');
		}

		this.repoLogger.info(
			{
				event: 'book.progress_history.appended',
				bookId: created.bookId,
				progressPercent: created.progressPercent,
				recordedAt: created.recordedAt
			},
			'Book progress history snapshot appended'
		);

		return created;
	}

	async getByBookId(bookId: number): Promise<BookProgressHistory[]> {
		return drizzleDb
			.select()
			.from(bookProgressHistory)
			.where(eq(bookProgressHistory.bookId, bookId))
			.orderBy(desc(bookProgressHistory.recordedAt));
	}
}

