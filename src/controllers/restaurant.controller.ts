import { RequestHandler, Request, Response } from 'express'
import { restaurantService } from '../services/restaurant.service'
import { fingerprint } from '../utils/fingerprint.utils';
import { Return } from '../types/api.types'

export class RestaurantController {
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const restaurants = await restaurantService.getAll()

    res.status(200).json({ message: 'List of all restaurants', data: restaurants } as Return)
  }

  public getOne: RequestHandler = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ message: 'Restaurant not found' } as Return)
      return
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' } as Return)
      return
    }

    res.status(200).json({ message: 'Restaurant details', data: restaurant } as Return)
  }

  public create: RequestHandler = async (req: Request, res: Response) => {
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: 'Invalid request' } as Return)
      return
    }

    const restaurant = await restaurantService.create(name)
    res.status(201).json({ message: 'Restaurant created', data: restaurant } as Return)
  }

  public vote: RequestHandler = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid restaurant ID' } as Return)
      return
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' } as Return)
      return
    }

    const fp = fingerprint.create(req);

    if (!fp || fingerprint.has(fp)) {
      res.status(429).json({ message: 'You have already voted' } as Return)
      return
    }

    restaurant.votes += 1
    const updated = await restaurantService.update(id, restaurant)

    fingerprint.add(fp);

    res.status(200).json({ message: 'Invalid request', data: updated } as Return)
  }

  public truncate: RequestHandler = async (_req: Request, res: Response) => {
    await restaurantService.truncate()
    res.status(200).json({ message: 'All restaurants deleted' } as Return)
  }
}

export const restaurantController = new RestaurantController()
