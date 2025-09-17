import { MongoClient, Db, ServerApiVersion, Collection } from 'mongodb'
import 'dotenv/config'
import User from '~/models/schemas/User.schema'

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1axpzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class databaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })

    this.db = this.client.db(`${process.env.DB_NAME}`)
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

  get user(): Collection<User> {
    return this.db.collection(`${process.env.DB_USERS_COLLECTION as string}`)
  }
}

export default new databaseService()
