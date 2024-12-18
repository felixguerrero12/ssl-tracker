import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { z } from 'zod';

let db: any;

interface TableColumn {
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
}

export async function openDb() {
    if (typeof window === 'undefined' && !db) {
        try {
            db = await open({
                filename: './websites.db',
                driver: sqlite3.Database
            });
            await db.exec(`
                CREATE TABLE IF NOT EXISTS websites (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT UNIQUE,
                    issuer TEXT,
                    validFrom TEXT,
                    validTo TEXT,
                    lastChecked TEXT,
                    status TEXT,
                    statusDetails TEXT,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Add new columns if they don't exist
            const columns = await db.all(`PRAGMA table_info(websites);`) as TableColumn[];
            if (!columns.some(col => col.name === 'status')) {
                await db.exec(`ALTER TABLE websites ADD COLUMN status TEXT;`);
            }
            if (!columns.some(col => col.name === 'statusDetails')) {
                await db.exec(`ALTER TABLE websites ADD COLUMN statusDetails TEXT;`);
            }
        } catch (error) {
            console.error('Failed to open database:', error);
            throw error;
        }
    }
    return db;
}

const WebsiteSchema = z.object({
    id: z.number().optional(),
    url: z.string().url(),
    issuer: z.string(),
    validFrom: z.string(),
    validTo: z.string(),
    lastChecked: z.string(),
    status: z.enum(['valid', 'expired', 'error']).optional(),
    statusDetails: z.string().optional(),
    createdAt: z.string().optional()
});

export type Website = z.infer<typeof WebsiteSchema>;

export async function addWebsite(website: Omit<Website, 'id'>): Promise<Website> {
    try {
        const db = await openDb();
        const { lastID } = await db.run(`
            INSERT INTO websites (
                url, 
                issuer, 
                validFrom, 
                validTo, 
                lastChecked,
                status,
                statusDetails
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            website.url,
            website.issuer,
            website.validFrom,
            website.validTo,
            website.lastChecked,
            website.status || 'valid',
            website.statusDetails || null
        ]);
        return { id: lastID, ...website };
    } catch (error) {
        console.error('Failed to add website to database:', error);
        throw error;
    }
}

export async function getWebsites(): Promise<Website[]> {
    try {
        const db = await openDb();
        return db.all('SELECT * FROM websites');
    } catch (error) {
        console.error('Failed to fetch websites from database:', error);
        throw error;
    }
}

export async function updateWebsite(website: Website): Promise<void> {
    try {
        const db = await openDb();
        await db.run(`
      UPDATE websites
      SET issuer = ?, validFrom = ?, validTo = ?, lastChecked = ?
      WHERE url = ?
    `, [website.issuer, website.validFrom, website.validTo, website.lastChecked, website.url]);
    } catch (error) {
        console.error('Failed to update website in database:', error);
        throw error;
    }
}

