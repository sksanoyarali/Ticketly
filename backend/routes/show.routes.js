import express from 'express'
import { addShow, getNowPlayingMovies } from '../controllers/show.controller.js'

const showRouter = express.Router()

showRouter.get('/nowplaying', getNowPlayingMovies)

showRouter.post('/add', addShow)
export default showRouter
