import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
	progressPercent: real('progress_percent'),
	rating: integer('rating'),
	createdAt: text('createdAt'),
	deletedAt: text('deleted_at'),
	trashExpiresAt: text('trash_expires_at')
});

export const pluginReleases = sqliteTable(
	'PluginReleases',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		version: text('version').notNull(),
		fileName: text('file_name').notNull(),
		storageKey: text('storage_key').notNull(),
		sha256: text('sha256').notNull(),
		isLatest: integer('is_latest', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull()
	},
	(table) => [uniqueIndex('plugin_releases_version_unique').on(table.version)]
);

export const deviceDownloads = sqliteTable('DeviceDownloads', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	deviceId: text('deviceId').notNull(),
	bookId: integer('bookId')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' })
});

export const deviceProgressDownloads = sqliteTable(
	'DeviceProgressDownloads',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		deviceId: text('deviceId').notNull(),
		bookId: integer('bookId')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		progressUpdatedAt: text('progress_updated_at').notNull()
	},
	(table) => [
		uniqueIndex('device_progress_downloads_device_book_unique').on(table.deviceId, table.bookId)
	]
);
