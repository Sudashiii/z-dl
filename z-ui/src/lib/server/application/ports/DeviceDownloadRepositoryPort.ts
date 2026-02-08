import type { DeviceDownload } from '$lib/server/domain/entities/DeviceDownload';

export interface DeviceDownloadRepositoryPort {
	getAll(): Promise<DeviceDownload[]>;
	getByDevice(deviceId: string): Promise<DeviceDownload[]>;
	create(download: Omit<DeviceDownload, 'id'>): Promise<DeviceDownload>;
	delete(id: number): Promise<void>;
}
