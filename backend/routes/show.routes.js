import express from 'express'
import { getNowPlayingMovies } from '../controllers/show.controller.js'

const showRouter = express.Router()

showRouter.get('/nowplaying', getNowPlayingMovies)

export default showRouter
