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
	cover: string | null;
	filesize: number | null;
	language: string | null;
	year: number | null;
	userId: string;
	userKey: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	error?: string;
	createdAt: Date;
}

class DownloadQueue {
	private queue: QueuedDownload[] = [];
	private isProcessing = false;
	private readonly queueLogger = createChildLogger({ component: 'downloadQueue' });
	private readonly downloadBookUseCase = new DownloadBookUseCase(
		new ZLibraryClient('https://1lib.sk'),
		new BookRepository(),
		() => DavUploadServiceFactory.createS3()
	);

	/**
	 * Add a download task to the queue
	 */
	enqueue(task: Omit<QueuedDownload, 'id' | 'status' | 'createdAt'>): string {
		const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		const queuedTask: QueuedDownload = {
			...task,
			id,
			status: 'queued',
			createdAt: new Date()
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
			this.queueLogger.info(
				{ event: 'queue.task.processing', taskId: task.id, bookId: task.bookId, title: task.title },
				'Processing queue task'
			);

			try {
				await this.processTask(task);
				task.status = 'completed';
				this.queueLogger.info(
					{ event: 'queue.task.completed', taskId: task.id, bookId: task.bookId, title: task.title },
					'Queue task completed'
				);
			} catch (error) {
				task.status = 'failed';
				task.error = error instanceof Error ? error.message : 'Unknown error';
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

			// Remove completed/failed tasks after a delay (cleanup)
			setTimeout(() => {
				this.queue = this.queue.filter(t => t.id !== task.id);
			}, 60000); // Keep for 1 minute for potential status checks
		}

		this.isProcessing = false;
	}

	/**
	 * Process a single download task
	 */
	private async processTask(task: QueuedDownload): Promise<void> {
		const useCaseResult = await this.downloadBookUseCase.execute({
			request: {
				bookId: task.bookId,
				hash: task.hash,
				title: task.title,
				upload: true,
				extension: task.extension,
				author: task.author ?? undefined,
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
		if (!useCaseResult.ok) {
			throw new Error(useCaseResult.error.message);
		}
	}
}

// Singleton instance
export const downloadQueue = new DownloadQueue();
