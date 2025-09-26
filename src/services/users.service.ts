import User from '~/models/schemas/User.schema'
import { registerReqBody } from '~/models/requests/User.request'
import UserModel from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/bcrypt'
import { TokenType } from '~/constants/enum'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { HTTP_STATUS } from '~/constants/httpStatus'

export const registerService = async (reqBody: registerReqBody) => {
  const newUser = await UserModel.create(
    new User({
      ...reqBody,
      date_of_birth: new Date(reqBody.date_of_birth),
      password: await hashPassword(reqBody.password)
    })
  )

  const user_id = newUser._id.toString()

  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService(user_id),
    signRefreshTokenService(user_id)
  ])

  const { password, ...newUserWithoutPassword } = newUser.toObject()

  return {
    ...newUserWithoutPassword,
    access_token: access_token,
    refresh_token: refresh_token
  }
}

export const signAccessTokenService = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.AccessToken
    },
    options: {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue
    }
  })
}

export const signRefreshTokenService = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.RefreshToken
    },
    options: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue
    }
  })
}

export const checkEmailExist = async (email: string) => {
  const emailExist = await UserModel.findOne({
    email: email
  })

  if (emailExist) {
    throw {
      message: 'Email already exists',
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    }
  }

  return true
}

export const checkUsernameExist = async (username: string) => {
  const user = await UserModel.findOne({
    username: username
  })

  if (user) {
    throw {
      message: 'Username already exists',
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY
    }
  }

  return true
}
