import express, { Router } from 'express'
import { usersRouter } from './routes/users.routes'
import { connectDb } from './config/db.config'
import { errorHandler } from './middlewares/error.middlewares'
import dotenv from 'dotenv'
import { mediasRouter } from './routes/media.routes'
dotenv.config()

const app = express()

app.use(express.json())

connectDb()

// routes
app.get('/', (req, res) => {
  res.send("What's up doc ?!")
})

// routes users
app.use('/users', usersRouter)

// routes medias
app.use('/medias', mediasRouter)

app.use(errorHandler)

// start the server
app.listen(3000, () => {
  console.log(`server running`)
})
