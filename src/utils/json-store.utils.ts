import { promises as fs } from 'fs';
import path from 'path';

export class JsonStore<T extends object> {
    private filePath: string;

    constructor(filename: string, baseDir = path.join(__dirname, '../../data')) {
        this.filePath = path.join(baseDir, filename);
    }

    async init(defaultValue: T[] = []): Promise<void> {
        try {
            await fs.access(this.filePath);
        } catch {
            await fs.writeFile(this.filePath, JSON.stringify(defaultValue, null, 2));
        }
    }

    async read(validator?: (item: unknown) => item is T): Promise<T[]> {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const parsed: unknown = JSON.parse(data);

            if (!Array.isArray(parsed)) throw new Error('Invalid data format');

            if (validator) {
                return parsed.filter(validator);
            }
            return parsed as T[];
        } catch {
            return [];
        }
    }

    async write(data: T[]): Promise<void> {
        await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
    }
}
