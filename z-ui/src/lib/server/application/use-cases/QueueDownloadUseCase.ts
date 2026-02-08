import { apiOk, type ApiResult } from '$lib/server/http/api';
import type { ZDownloadBookRequest } from '$lib/types/ZLibrary/Requests/ZDownloadBookRequest';

interface QueueTask {
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
}

interface DownloadQueuePort {
	enqueue(task: QueueTask): string;
	getStatus(): { pending: number; processing: number };
}

interface QueueDownloadInput {
	request: ZDownloadBookRequest;
	credentials: { userId: string; userKey: string };
}

interface QueueDownloadResult {
	success: true;
	taskId: string;
	message: string;
	queueStatus: {
		pending: number;
		processing: number;
	};
}

export class QueueDownloadUseCase {
	constructor(private readonly queue: DownloadQueuePort) {}

	async execute(input: QueueDownloadInput): Promise<ApiResult<QueueDownloadResult>> {
		const { request, credentials } = input;
		const taskId = this.queue.enqueue({
			bookId: request.bookId,
			hash: request.hash,
			title: request.title,
			extension: request.extension ?? 'epub',
			author: request.author ?? null,
			cover: request.cover ?? null,
			filesize: request.filesize ?? null,
			language: request.language ?? null,
			year: request.year ?? null,
			userId: credentials.userId,
			userKey: credentials.userKey
		});

		return apiOk({
			success: true,
			taskId,
			message: 'Download queued successfully',
			queueStatus: this.queue.getStatus()
		});
	}
}
