import { registerReqBody } from '~/models/requests/User.request'
import UserModel from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/bcrypt'
import { TokenType } from '~/constants/enum'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import { ConflictError } from '~/utils/CustomErrors'

export const registerService = async (reqBody: registerReqBody) => {
  const newUser = await UserModel.create(
      {
        ...reqBody,
      date_of_birth: new Date(reqBody.date_of_birth),
      password: await hashPassword(reqBody.password)
    }
  )

  const user_id = newUser._id.toString()

  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService(user_id),
    signRefreshTokenService(user_id)
  ])

  await RefreshTokenModel.create({
    token: refresh_token,
    created_at: new Date(),
    user_id: user_id
  })

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
    throw new ConflictError(USERS_MESSAGES.EMAIL_IS_EXIST)
  }

  return true
}

export const checkUsernameExist = async (username: string) => {
  const user = await UserModel.findOne({
    username: username
  })

  if (user) {
    throw new ConflictError(USERS_MESSAGES.USER_IS_EXIST)
  }

  return true
}

export const loginService = async (user_id: string) => {
  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService(user_id),
    signRefreshTokenService(user_id)
  ])
  await RefreshTokenModel.create({
    token: refresh_token,
    created_at: new Date(),
    user_id: user_id
  })
  return {
    access_token,
    refresh_token
  }
}
