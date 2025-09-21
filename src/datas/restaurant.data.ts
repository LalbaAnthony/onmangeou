import { promises as fs } from 'fs';
import path from 'path';
import { Restaurant } from '../types/restaurant.types';

const DATA_FILE: string = path.join(__dirname, '../../data/restaurants.json');

export async function initData(): Promise<void> {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
}

export async function readData(): Promise<Restaurant[]> {
    try {
        const data: string = await fs.readFile(DATA_FILE, 'utf8');
        const parsed: unknown = JSON.parse(data);
        
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid data format');
        }
        
        return parsed.map((item: unknown): Restaurant => {
            if (typeof item !== 'object' || item === null) {
                throw new Error('Invalid restaurant object');
            }
            
            const restaurant = item as Record<string, unknown>;
            
            if (typeof restaurant.id !== 'number' ||
                typeof restaurant.name !== 'string' ||
                typeof restaurant.votes !== 'number') {
                throw new Error('Invalid restaurant properties');
            }
            
            return {
                id: restaurant.id,
                name: restaurant.name,
                votes: restaurant.votes
            };
        });
    } catch {
        return [];
    }
}

export async function writeData(data: Restaurant[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}