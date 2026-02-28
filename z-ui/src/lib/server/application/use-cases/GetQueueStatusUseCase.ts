import { apiOk, type ApiResult } from '$lib/server/http/api';

interface QueueJobSnapshot {
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

interface DownloadQueuePort {
	getStatus(): { pending: number; processing: number };
	getTasks(): QueueJobSnapshot[];
}

interface GetQueueStatusResult {
	success: true;
	queueStatus: {
		pending: number;
		processing: number;
	};
	jobs: QueueJobSnapshot[];
}

export class GetQueueStatusUseCase {
	constructor(private readonly queue: DownloadQueuePort) {}

	async execute(): Promise<ApiResult<GetQueueStatusResult>> {
		return apiOk({
			success: true,
			queueStatus: this.queue.getStatus(),
			jobs: this.queue.getTasks()
		});
	}
}
