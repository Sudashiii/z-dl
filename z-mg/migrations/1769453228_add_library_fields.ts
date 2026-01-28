// Migration: AddLibraryFields
import type { Client } from "@libsql/client";

export async function up(db: Client): Promise<void> {
    // Helper to check and add column if missing
    async function addColumnIfNotExists(table: string, columnDef: string, colName: string) {
        const columns = await db.execute(`PRAGMA table_info(${table})`);
        const hasColumn = columns.rows.some((row: any) => row.name === colName);
        if (!hasColumn) {
            await db.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
        }
    }

    await addColumnIfNotExists('Books', 'zLibId TEXT', 'zLibId');
    await addColumnIfNotExists('Books', 'author TEXT', 'author');
    await addColumnIfNotExists('Books', 'cover TEXT', 'cover');
    await addColumnIfNotExists('Books', 'extension TEXT', 'extension');
    await addColumnIfNotExists('Books', 'filesize INTEGER', 'filesize');
    await addColumnIfNotExists('Books', 'language TEXT', 'language');
    await addColumnIfNotExists('Books', 'year INTEGER', 'year');

    // SQLite doesn't support ADD COLUMN with non-constant default (CURRENT_TIMESTAMP)
    // So we add it without default, then use a trigger and backfill
    await addColumnIfNotExists('Books', 'createdAt TEXT', 'createdAt');

    await db.execute(`
        CREATE TRIGGER IF NOT EXISTS set_books_timestamp 
        AFTER INSERT ON Books 
        FOR EACH ROW 
        WHEN NEW.createdAt IS NULL 
        BEGIN 
            UPDATE Books SET createdAt = CURRENT_TIMESTAMP WHERE id = NEW.id; 
        END
    `);

    // Backfill existing records
    await db.execute("UPDATE Books SET createdAt = CURRENT_TIMESTAMP WHERE createdAt IS NULL");

    console.log("Applying 'up' migration: AddLibraryFields");
}

export async function down(db: Client): Promise<void> {
    // Drop the trigger first
    await db.execute("DROP TRIGGER IF EXISTS set_books_timestamp");

    // Drop the columns
    await db.execute("ALTER TABLE Books DROP COLUMN zLibId");
    await db.execute("ALTER TABLE Books DROP COLUMN author");
    await db.execute("ALTER TABLE Books DROP COLUMN cover");
    await db.execute("ALTER TABLE Books DROP COLUMN extension");
    await db.execute("ALTER TABLE Books DROP COLUMN filesize");
    await db.execute("ALTER TABLE Books DROP COLUMN language");
    await db.execute("ALTER TABLE Books DROP COLUMN year");
    await db.execute("ALTER TABLE Books DROP COLUMN createdAt");

    console.log("Applying 'down' migration: AddLibraryFields");
}
