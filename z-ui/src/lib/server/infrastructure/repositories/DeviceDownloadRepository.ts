import type { DeviceDownloadRepositoryPort } from '$lib/server/application/ports/DeviceDownloadRepositoryPort';
import { db } from '$lib/server/infrastructure/db/db';
import type { DeviceDownload } from '$lib/server/domain/entities/DeviceDownload';

export class DeviceDownloadRepository implements DeviceDownloadRepositoryPort {
	private static readonly instance = new DeviceDownloadRepository();

	async getAll(): Promise<DeviceDownload[]> {
		const result = await db.execute('SELECT * FROM DeviceDownloads');
		return result.rows as unknown as DeviceDownload[];
	}

	async getByDevice(deviceId: string): Promise<DeviceDownload[]> {
		const result = await db.execute({
			sql: 'SELECT * FROM DeviceDownloads WHERE deviceId = ?',
			args: [deviceId]
		});
		return result.rows as unknown as DeviceDownload[];
	}

	async create(download: Omit<DeviceDownload, 'id'>): Promise<DeviceDownload> {
		const result = await db.execute({
			sql: 'INSERT INTO DeviceDownloads (deviceId, bookId) VALUES (?, ?)',
			args: [download.deviceId, download.bookId]
		});

		return {
			id: Number(result.lastInsertRowid),
			...download
		};
	}

	async delete(id: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM DeviceDownloads WHERE id = ?',
			args: [id]
		});
	}

	static async getAll(): Promise<DeviceDownload[]> {
		return DeviceDownloadRepository.instance.getAll();
	}

	static async getByDevice(deviceId: string): Promise<DeviceDownload[]> {
		return DeviceDownloadRepository.instance.getByDevice(deviceId);
	}

	static async create(download: Omit<DeviceDownload, 'id'>): Promise<DeviceDownload> {
		return DeviceDownloadRepository.instance.create(download);
	}

	static async delete(id: number): Promise<void> {
		return DeviceDownloadRepository.instance.delete(id);
	}
}
