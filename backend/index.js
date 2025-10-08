import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDb from './configs/db.js'
dotenv.config()
const app = express()
const port = 3000
await connectDb()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('server is live')
})

app.listen(port, () => {
  console.log(`Server is listening at port ${port}`)
})
