import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const books = sqliteTable('Books', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	s3StorageKey: text('s3_storage_key').notNull(),
	title: text('title').notNull(),
	zLibId: text('zLibId'),
	author: text('author'),
	cover: text('cover'),
	extension: text('extension'),
	filesize: integer('filesize'),
	language: text('language'),
	year: integer('year'),
	progressStorageKey: text('progress_storage_key'),
	progressUpdatedAt: text('progress_updated_at'),
	createdAt: text('createdAt')
});

export const deviceDownloads = sqliteTable('DeviceDownloads', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	deviceId: text('deviceId').notNull(),
	bookId: integer('bookId')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' })
});
