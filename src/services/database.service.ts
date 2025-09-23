import { MongoClient, Db, ServerApiVersion, Collection } from 'mongodb'
import User from '~/models/schemas/User.schema'
import { dbConfig } from '~/config/db.config'

class databaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(dbConfig.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: dbConfig.serverApiOptions.strict,
        deprecationErrors: dbConfig.serverApiOptions.deprecationErrors
      }
    })

    this.db = this.client.db(dbConfig.dbName)
  }

  async connect() {
    try {
      await this.client.connect()
      console.log('✅ MongoDB connected')
      return this.client.db(dbConfig.dbName)
    } catch (err) {
      console.error('MongoDB connect error:', err)
      throw err
    }
  }

  get user(): Collection<User> {
    return this.db.collection(dbConfig.collections.users)
  }
}

export default new databaseService()
