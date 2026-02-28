import { DavUploadServiceFactory } from '$lib/server/infrastructure/factories/DavUploadServiceFactory';
import { DownloadBookUseCase } from '$lib/server/application/use-cases/DownloadBookUseCase';
import { ZLibraryClient } from '$lib/server/infrastructure/clients/ZLibraryClient';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';
import { createChildLogger, toLogError } from '$lib/server/infrastructure/logging/logger';

export interface QueuedDownload {
	id: string;
	bookId: string;
	hash: string;
	title: string;
	extension: string;
	author: string | null;
	publisher: string | null;
	series: string | null;
	volume: string | null;
	edition: string | null;
	identifier: string | null;
	pages: number | null;
	description: string | null;
	cover: string | null;
	filesize: number | null;
	language: string | null;
	year: number | null;
	userId: string;
	userKey: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	attempts: number;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
	finishedAt?: Date;
}

export interface QueuedDownloadSnapshot {
	id: string;
	bookId: string;
	title: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	attempts: number;
	error?: string;
	createdAt: string;
	updatedAt: string;
	finishedAt?: string;
}

class DownloadQueue {
	private queue: QueuedDownload[] = [];
	private isProcessing = false;
	private readonly maxAttempts = 3;
	private readonly completedTaskRetentionMs = 30 * 60 * 1000;
	private readonly queueLogger = createChildLogger({ component: 'downloadQueue' });
	private readonly downloadBookUseCase = new DownloadBookUseCase(
		new ZLibraryClient('https://1lib.sk'),
		new BookRepository(),
		() => DavUploadServiceFactory.createS3()
	);

	/**
	 * Add a download task to the queue
	 */
	enqueue(task: Omit<QueuedDownload, 'id' | 'status' | 'attempts' | 'createdAt' | 'updatedAt' | 'finishedAt'>): string {
		const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date();
		
		const queuedTask: QueuedDownload = {
			...task,
			id,
			status: 'queued',
			attempts: 0,
			createdAt: now,
			updatedAt: now
		};

		this.queue.push(queuedTask);
		this.queueLogger.info(
			{ event: 'queue.task.enqueued', taskId: id, bookId: task.bookId, title: task.title },
			'Queue task added'
		);

		// Start processing if not already running
		this.processQueue();

		return id;
	}

	/**
	 * Get current queue status
	 */
	getStatus(): { pending: number; processing: number } {
		return {
			pending: this.queue.filter(t => t.status === 'queued').length,
			processing: this.queue.filter(t => t.status === 'processing').length
		};
	}

	getTasks(): QueuedDownloadSnapshot[] {
		return [...this.queue]
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
			.map((task) => ({
				id: task.id,
				bookId: task.bookId,
				title: task.title,
				status: task.status,
				attempts: task.attempts,
				error: task.error,
				createdAt: task.createdAt.toISOString(),
				updatedAt: task.updatedAt.toISOString(),
				finishedAt: task.finishedAt?.toISOString()
			}));
	}

	/**
	 * Process queued downloads one by one
	 */
	private async processQueue(): Promise<void> {
		if (this.isProcessing) return;
		
		this.isProcessing = true;

		while (true) {
			const task = this.queue.find(t => t.status === 'queued');
			if (!task) break;

			task.status = 'processing';
			task.updatedAt = new Date();
			this.queueLogger.info(
				{ event: 'queue.task.processing', taskId: task.id, bookId: task.bookId, title: task.title },
				'Processing queue task'
			);

			try {
				await this.processTask(task);
				task.status = 'completed';
				task.updatedAt = new Date();
				task.finishedAt = task.updatedAt;
				this.queueLogger.info(
					{ event: 'queue.task.completed', taskId: task.id, bookId: task.bookId, title: task.title },
					'Queue task completed'
				);
			} catch (error) {
				task.status = 'failed';
				task.error = error instanceof Error ? error.message : 'Unknown error';
				task.updatedAt = new Date();
				task.finishedAt = task.updatedAt;
				this.queueLogger.error(
					{
						event: 'queue.task.failed',
						taskId: task.id,
						bookId: task.bookId,
						title: task.title,
						error: toLogError(error)
					},
					'Queue task failed'
				);
			}

			this.cleanupFinishedTasks();
		}

		this.isProcessing = false;
	}

	/**
	 * Process a single download task
	 */
	private async processTask(task: QueuedDownload): Promise<void> {
		for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
			task.attempts = attempt;
			task.updatedAt = new Date();
			const useCaseResult = await this.downloadBookUseCase.execute({
				request: {
					bookId: task.bookId,
					hash: task.hash,
					title: task.title,
					upload: true,
					extension: task.extension,
					author: task.author ?? undefined,
					publisher: task.publisher ?? undefined,
					series: task.series ?? undefined,
					volume: task.volume ?? undefined,
					edition: task.edition ?? undefined,
					identifier: task.identifier ?? undefined,
					pages: task.pages ?? undefined,
					description: task.description ?? undefined,
					cover: task.cover ?? undefined,
					filesize: task.filesize ?? undefined,
					language: task.language ?? undefined,
					year: task.year ?? undefined,
					downloadToDevice: false
				},
				credentials: {
					userId: task.userId,
					userKey: task.userKey
				}
			});

			if (useCaseResult.ok) {
				return;
			}

			const canRetry = this.isRetryableFailure(useCaseResult.error.status, useCaseResult.error.message);
			const isLastAttempt = attempt === this.maxAttempts;
			if (!canRetry || isLastAttempt) {
				throw new Error(useCaseResult.error.message, { cause: useCaseResult.error.cause });
			}

			const delayMs = this.getRetryDelayMs(attempt);
			this.queueLogger.warn(
				{
					event: 'queue.task.retry',
					taskId: task.id,
					bookId: task.bookId,
					attempt,
					nextAttempt: attempt + 1,
					delayMs,
					statusCode: useCaseResult.error.status,
					reason: useCaseResult.error.message
				},
				'Queue task failed with retryable error, retrying'
			);
			await this.sleep(delayMs);
		}
	}

	private isRetryableFailure(statusCode: number, message: string): boolean {
		if (statusCode === 429 || statusCode >= 500) {
			return true;
		}

		const normalized = message.toLowerCase();
		return (
			normalized.includes('terminated') ||
			normalized.includes('timeout') ||
			normalized.includes('econnreset') ||
			normalized.includes('network') ||
			normalized.includes('failed to execute get request') ||
			normalized.includes('failed to execute post request')
		);
	}

	private getRetryDelayMs(attempt: number): number {
		// 500ms, 1000ms, 2000ms...
		return 500 * 2 ** (attempt - 1);
	}

	private async sleep(ms: number): Promise<void> {
		await new Promise<void>((resolve) => {
			setTimeout(() => resolve(), ms);
		});
	}

	private cleanupFinishedTasks(): void {
		const cutoff = Date.now() - this.completedTaskRetentionMs;
		this.queue = this.queue.filter((task) => {
			if (task.status === 'queued' || task.status === 'processing') {
				return true;
			}
			return (task.finishedAt?.getTime() ?? task.updatedAt.getTime()) >= cutoff;
		});
	}
}

// Singleton instance
export const downloadQueue = new DownloadQueue();
