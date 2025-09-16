import { MongoClient, ServerApiVersion } from 'mongodb'
import 'dotenv/config'

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1axpzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class databaseService {
  private client: MongoClient

  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })
  }

  async connect() {
    try {
      await this.client.connect()
      console.log('✅ MongoDB connected')
      return this.client.db('X-Dev')
    } catch (err) {
      console.error('MongoDB connect error:', err)
      throw err
    }
  }
}

export default new databaseService()
