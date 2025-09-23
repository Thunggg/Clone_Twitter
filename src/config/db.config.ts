import 'dotenv/config'
import mongoose from 'mongoose'

export const connectDb = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1axpzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, // databaseNameHere
      {
        dbName: process.env.DB_NAME
      }
    )
    console.log('database connection successfully')
  } catch (error) {
    console.log(`failed to connect database ${error}`)
  }
}
