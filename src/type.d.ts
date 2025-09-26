import { Request } from 'express'
import UserModel from '~/models/schemas/User.schema'

declare module 'express' {
  interface Request {
    user?: UserModel
  }
}
