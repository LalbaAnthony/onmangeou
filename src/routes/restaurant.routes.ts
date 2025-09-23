import { Router } from 'express'
import { restaurantController } from '../controllers/restaurant.controller'

const router = Router()

router.get('/', restaurantController.getAll)
router.post('/', restaurantController.create)
router.post('/:id/vote', restaurantController.vote)
router.delete('/truncate', restaurantController.truncate)

export default router
