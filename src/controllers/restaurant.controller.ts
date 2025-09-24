import { RequestHandler, Request, Response } from 'express'
import { restaurantService } from '../services/restaurant.service'
import { fingerprint } from '../utils/fingerprint.utils';

export class RestaurantController {
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const restaurants = await restaurantService.getAll()

    res.status(200).json({
      message: 'List of all restaurants',
      data: restaurants
    })
  }

  public getOne: RequestHandler = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid restaurant ID' })
      return
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' })
      return
    }

    res.status(200).json({
      message: 'Restaurant details',
      data: restaurant
    })
  }

  public create: RequestHandler = async (req: Request, res: Response) => {
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      res.status(400).json({ message: 'Invalid restaurant name' })
      return
    }

    const restaurant = await restaurantService.create(name)
    res.status(201).json({
      message: 'Restaurant created',
      data: restaurant
    })
  }

  public vote: RequestHandler = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid restaurant ID' })
      return
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ message: 'Restaurant not found' })
      return
    }

    const fp = fingerprint.create(req);

    if (!fp || fingerprint.has(fp)) {
      res.status(429).json({ message: 'You have already voted' })
      return
    }

    restaurant.votes += 1
    const updated = await restaurantService.update(id, restaurant)

    fingerprint.add(fp);

    res.status(200).json({
      message: 'Vote recorded',
      data: updated
    })
  }

  public truncate: RequestHandler = async (_req: Request, res: Response) => {
    await restaurantService.truncate()
    res.status(200).json({
      message: 'All restaurants deleted'
    })
  }
}

export const restaurantController = new RestaurantController()
