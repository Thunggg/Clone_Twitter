import jwt, { JsonWebTokenError, PrivateKey } from 'jsonwebtoken'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'

export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey?: string
  options?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, function (err, token) {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}

export const verifyToken = ({
  access_token,
  privateKey = process.env.JWT_SECRET as string
}: {
  access_token: string
  privateKey?: string
}) => {
  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(access_token, privateKey, function (err, decoded) {
      if (err as JsonWebTokenError) {
        throw {
          message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        }
      }
      resolve(decoded as jwt.JwtPayload)
    })
  })
}
