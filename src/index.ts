import express, { Router } from 'express'
import { usersRouter } from './routes/users.routes'
import { connectDb } from './config/db.config'
import { errorHandler } from './middlewares/error.middlewares'
import dotenv from 'dotenv'
dotenv.config()

const app = express()

app.use(express.json())

connectDb()

// routes
app.get('/', (req, res) => {
  res.send("What's up doc ?!")
})

app.use('/users', usersRouter)

app.use(errorHandler)

// start the server
app.listen(3000, () => {
  console.log(`server running`)
})
