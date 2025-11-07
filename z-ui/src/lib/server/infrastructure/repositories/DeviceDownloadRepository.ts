import { db } from '$lib/server/infrastructure/db';
import type { DeviceDownload } from '$lib/server/infrastructure/dbModels/models';

export class DeviceDownloadRepository {
	static getAll(): DeviceDownload[] {
		return db.prepare('SELECT * FROM DeviceDownloads').all() as DeviceDownload[];
	}

	static getByDevice(deviceId: string): DeviceDownload[] {
		return db
			.prepare('SELECT * FROM DeviceDownloads WHERE deviceId = ?')
			.all(deviceId) as DeviceDownload[];
	}

	static create(download: Omit<DeviceDownload, 'id'>): DeviceDownload {
		const result = db
			.prepare('INSERT INTO DeviceDownloads (deviceId, bookId) VALUES (?, ?)')
			.run(download.deviceId, download.bookId);

		return {
			id: Number(result.lastInsertRowid),
			...download
		};
	}

	static delete(id: number): void {
		db.prepare('DELETE FROM DeviceDownloads WHERE id = ?').run(id);
	}
}
