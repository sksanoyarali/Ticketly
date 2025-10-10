import express from 'express'
import {
  getAllbookings,
  getAllShows,
  getDashBoardData,
  isAdmin,
} from '../controllers/admin.controller.js'
import { protectAdmin } from '../middlewares/auth.middleware.js'

const adminRouter = express.Router()

adminRouter.get('/is-admin', protectAdmin, isAdmin)

adminRouter.get('/dashboard', protectAdmin, getDashBoardData)

adminRouter.get('/all-shows', protectAdmin, getAllShows)

adminRouter.get('/all-bookings', protectAdmin, getAllbookings)

export default adminRouter
