import { Request } from 'express'
import UserModel from '~/models/schemas/User.schema'
import { TokenPayload } from './models/requests/User.request'

declare module 'express' {
  interface Request {
    user?: UserModel
    decode_authorization?: TokenPayload
    decode_refresh_token?: TokenPayload
  }
}
