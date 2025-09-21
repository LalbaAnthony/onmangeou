import { readData, writeData } from '../datas/restaurant.data'
export class RestaurantService {
  private generateId(restaurants: Restaurant[]): number {
    return restaurants.length > 0 ? Math.max(...restaurants.map(r => r.id)) + 1 : 1;
  }

  public async getAll(): Promise<Restaurant[]> {
    const restaurants: Restaurant[] = await readData();
    const sorted: Restaurant[] = restaurants.sort((a, b) => b.votes - a.votes);
    return sorted;
  }

  public async create(name: string): Promise<Restaurant> {
    const restaurants: Restaurant[] = await readData();

    const restaurant: Restaurant = {
      id: this.generateId(restaurants),
      name,
      votes: 0
    };

    restaurants.push(restaurant);
    await writeData(restaurants);

    return restaurant;
  }

  public async getById(id: number): Promise<Restaurant | null> {
    const restaurants: Restaurant[] = await readData();
    const restaurant = restaurants.find(r => r.id === id) || null;
    return restaurant;
  }

  public async update(id: number, restaurant: Restaurant): Promise<Restaurant | null> {
    const restaurants: Restaurant[] = await readData();
    const index = restaurants.findIndex(r => r.id === id);

    if (index === -1) {
      return null;
    }
    restaurants[index] = { ...restaurants[index], ...restaurant };
    await writeData(restaurants);
    return restaurants[index];
  }
}

export const restaurantService = new RestaurantService();
