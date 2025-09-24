import { JsonStore } from '../utils/json-store.utils';
import { Restaurant } from '../types/restaurant.types';

const restaurantStore = new JsonStore<Restaurant>('restaurants.json');

export async function initData(): Promise<void> {
    await restaurantStore.init();
}
export async function readData(): Promise<Restaurant[]> {
    return restaurantStore.read();

}
export async function writeData(data: Restaurant[]): Promise<void> {
    return restaurantStore.write(data);
}
