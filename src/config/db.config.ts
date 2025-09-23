import 'dotenv/config'

// Database configuration
export const dbConfig = {
  uri: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1axpzsn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
  dbName: process.env.DB_NAME || 'X-Dev',
  collections: {
    users: process.env.DB_USERS_COLLECTION || 'users'
  },
  serverApiOptions: {
    version: '1' as const,
    strict: true,
    deprecationErrors: true
  }
}
