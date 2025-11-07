export interface Book {
	id: number;
	zLibId: string;
	s3_storage_key: string;
	title: string;
}

export interface DeviceDownload {
	id: number;
	deviceId: string;
	bookId: number;
}
