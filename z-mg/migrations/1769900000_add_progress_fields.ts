import type { Client } from "@libsql/client";

export async function up(db: Client): Promise<void> {
    async function addColumnIfNotExists(table: string, columnDef: string, colName: string) {
        const columns = await db.execute(`PRAGMA table_info(${table})`);
        const hasColumn = columns.rows.some((row: any) => row.name === colName);
        if (!hasColumn) {
            await db.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
        }
    }

    await addColumnIfNotExists('Books', 'progress_storage_key TEXT', 'progress_storage_key');
    await addColumnIfNotExists('Books', 'progress_updated_at TEXT', 'progress_updated_at');

    console.log("Applying 'up' migration: AddProgressFields");
}

export async function down(db: Client): Promise<void> {
    await db.execute('ALTER TABLE Books DROP COLUMN progress_storage_key');
    await db.execute('ALTER TABLE Books DROP COLUMN progress_updated_at');

    console.log("Applying 'down' migration: AddProgressFields");
}
