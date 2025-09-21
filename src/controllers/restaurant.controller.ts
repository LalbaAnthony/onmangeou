import { RequestHandler } from 'express'
import { restaurantService } from '../services/restaurant.service'

export class RestaurantController {
  public getAll: RequestHandler = async (req, res) => {
    const restaurants = await restaurantService.getAll()

    res.status(200).json({
      message: 'List of all restaurants',
      data: restaurants
    })
  }

  public getOne: RequestHandler = async (req, res) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid restaurant ID' })
      return    
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' })
      return    
    }

    res.status(200).json({
      message: 'Restaurant details',
      data: restaurant
    })
  }

  public create: RequestHandler = async (req, res) => {
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Invalid restaurant name' })
      return
    }

    const restaurant = await restaurantService.create(name)
    res.status(201).json({
      message: 'Restaurant created',
      data: restaurant
    })
  }

  public vote: RequestHandler = async (req, res) => {
    const id = parseInt(req.params.id as string, 10)

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid restaurant ID' })
      return
    }

    const restaurant = await restaurantService.getById(id)
    if (!restaurant) {
      res.status(404).json({ error: 'Restaurant not found' })
      return
    }

    restaurant.votes += 1
    const updated = await restaurantService.update(id, restaurant)

    res.status(200).json({
      message: 'Vote recorded',
      data: updated
    })
  }
}

export const restaurantController = new RestaurantController()
