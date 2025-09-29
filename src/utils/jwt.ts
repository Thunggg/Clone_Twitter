import jwt, { JsonWebTokenError, PrivateKey } from 'jsonwebtoken'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.request'

export const signToken = ({
  payload,
  privateKey,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, function (err, token) {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}

export const verifyToken = ({ token, privateKey }: { token: string; privateKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, privateKey, function (err, decoded) {
      if (err as JsonWebTokenError) {
        return reject(err)
      }
      resolve(decoded as TokenPayload)
    })
  })
}
