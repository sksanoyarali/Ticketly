import express from 'express'
import { addShow, getNowPlayingMovies } from '../controllers/show.controller.js'
import { protectAdmin } from '../middlewares/auth.middleware.js'

const showRouter = express.Router()

showRouter.get('/nowplaying', protectAdmin, getNowPlayingMovies)

showRouter.post('/add', protectAdmin, addShow)
export default showRouter
