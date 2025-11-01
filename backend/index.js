import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import { clerkMiddleware } from '@clerk/express'
import { serve } from 'inngest/express'
import { inngest, functions } from './inngest/index.js'
import connectDb from './configs/db.js'
import showRouter from './routes/show.routes.js'
import bookingRouter from './routes/booking.routes.js'
import adminRouter from './routes/admin.routes.js'
import userRouter from './routes/user.routes.js'
import 'dotenv/config' // Add this line at the very top
import { stripeWebhooks } from './controllers/stripeWebHooks.js'
const app = express()
const port = 3000
connectDb()

// stripe Webhooks Route
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)
//middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
)
app.use(clerkMiddleware())

app.get('/', (req, res) => {
  res.send('server is live')
})
app.use('/api/inngest', serve({ client: inngest, functions }))

app.use('/api/show', showRouter)

app.use('/api/booking', bookingRouter)

app.use('/api/admin', adminRouter)

app.use('/api/user', userRouter)
app.listen(port, () => {
  console.log(`Server is listening at port ${port}`)
})
