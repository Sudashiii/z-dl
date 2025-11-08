import { db } from '$lib/server/infrastructure/db/db';
import type { DeviceDownload } from '$lib/server/infrastructure/dbModels/models';

export class DeviceDownloadRepository {
	static async getAll(): Promise<DeviceDownload[]> {
		const result = await db.execute('SELECT * FROM DeviceDownloads');
		return result.rows as unknown as DeviceDownload[];
	}

	static async getByDevice(deviceId: string): Promise<DeviceDownload[]> {
		const result = await db.execute({
			sql: 'SELECT * FROM DeviceDownloads WHERE deviceId = ?',
			args: [deviceId]
		});
		return result.rows as unknown as DeviceDownload[];
	}

	static async create(download: Omit<DeviceDownload, 'id'>): Promise<DeviceDownload> {
		const result = await db.execute({
			sql: 'INSERT INTO DeviceDownloads (deviceId, bookId) VALUES (?, ?)',
			args: [download.deviceId, download.bookId]
		});

		return {
			id: Number(result.lastInsertRowid),
			...download
		};
	}

	static async delete(id: number): Promise<void> {
		await db.execute({
			sql: 'DELETE FROM DeviceDownloads WHERE id = ?',
			args: [id]
		});
	}
}
