import express, { Router } from 'express'
import databaseService from './services/database.service'
import { usersRouter } from './routes/users.routes'

const app = express()

app.use(express.json())

databaseService.connect()

// routes
app.get('/', (req, res) => {
  res.send("What's up doc ?!")
})

app.use('/users', usersRouter)

// start the server
app.listen(3000, () => {
  console.log(`server running`)
})
