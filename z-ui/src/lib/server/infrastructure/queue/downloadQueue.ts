import { DavUploadServiceFactory } from '$lib/server/application/factories/DavUploadServiceFactory';
import { ZLibrary } from '$lib/server/application/ZLibrary';
import { BookRepository } from '$lib/server/infrastructure/repositories/BookRepository';

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
	private zlib = new ZLibrary('https://1lib.sk');

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
		console.log(`[Queue] Task ${id} added for book: ${task.title}`);

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
			console.log(`[Queue] Processing task ${task.id}: ${task.title}`);

			try {
				await this.processTask(task);
				task.status = 'completed';
				console.log(`[Queue] Completed task ${task.id}: ${task.title}`);
			} catch (error) {
				task.status = 'failed';
				task.error = error instanceof Error ? error.message : 'Unknown error';
				console.error(`[Queue] Failed task ${task.id}:`, error);
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
		// Login to Z-Library
		const loggedIn = await this.zlib.tokenLogin(task.userId, task.userKey);
		if (!loggedIn) {
			throw new Error('Z-Library login failed');
		}

		// Download the book
		const bookDownloadResponse = await this.zlib.download(task.bookId, task.hash);
		const fileBuffer = await bookDownloadResponse.arrayBuffer();

		// Upload to S3
		const uploadService = DavUploadServiceFactory.createS3();
		const key = `${task.title}_${task.bookId}.${task.extension}`;
		await uploadService.upload(key, Buffer.from(fileBuffer));

		// Save to database
		await BookRepository.create({
			zLibId: task.bookId,
			s3_storage_key: key,
			title: task.title,
			author: task.author,
			cover: task.cover,
			extension: task.extension,
			filesize: task.filesize,
			language: task.language,
			year: task.year,
			isDownloaded: false // Not downloaded to device, just in library
		});
	}
}

// Singleton instance
export const downloadQueue = new DownloadQueue();
