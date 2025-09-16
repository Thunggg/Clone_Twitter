import express from 'express'
import databaseService from './services/database.service'

const app = express()

databaseService.connect()

// routes
app.get('/', (req, res) => {
  res.send("What's up doc ?!")
})

// start the server
app.listen(3000, () => {
  console.log(`server running`)
})
