import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { clerkMiddleware } from '@clerk/express'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js'
import connectDb from './configs/db.js'
import showRouter from './routes/show.routes.js'
dotenv.config()
const app = express()
const port = 3000
connectDb()
//middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(clerkMiddleware())

app.get('/', (req, res) => {
  res.send('server is live')
})
app.use('/api/inngest', serve({ client: inngest, functions }))
app.use('/api/show', showRouter)
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`)
})
