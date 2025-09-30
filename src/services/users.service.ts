import { registerReqBody } from '~/models/requests/User.request'
import UserModel from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/bcrypt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import { ConflictError } from '~/utils/CustomErrors'
import { ObjectId } from 'mongodb'

export const registerService = async (reqBody: registerReqBody) => {
  const _id = new ObjectId()
  const user_id = _id.toString()

  const emailVerifyToken = await signEmailVerifyTokenService(user_id)

  const newUser = await UserModel.create({
    ...reqBody,
    _id,
    email_verify_token: emailVerifyToken,
    date_of_birth: new Date(reqBody.date_of_birth),
    password: await hashPassword(reqBody.password)
  })

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
    privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
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
    privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
    options: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as StringValue
    }
  })
}

export const signEmailVerifyTokenService = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.EmailVerifyToken
    },
    privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
    options: {
      expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as StringValue
    }
  })
}

export const signForgotPasswordTokenService = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.EmailVerifyToken
    },
    privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
    options: {
      expiresIn: process.env.EMAIL_FORGOT_PASSWORD_EXPIRES_IN as StringValue
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

export const emailVerifyService = async (user_id: string) => {
  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService(user_id),
    signRefreshTokenService(user_id),
    UserModel.updateOne(
      {
        _id: new ObjectId(user_id as string)
      },
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified,
          updatedAt: new Date()
        }
      }
    )
  ])

  return {
    access_token,
    refresh_token
  }
}

export const resendVerifyEmailService = async (user_id: string) => {
  const emailVerifyToken = await signEmailVerifyTokenService(user_id)

  await UserModel.updateOne(
    {
      _id: new ObjectId(user_id as string)
    },
    {
      $set: {
        email_verify_token: emailVerifyToken,
        updatedAt: new Date()
      }
    }
  )
}

export const forgotPasswordService = async (user_id: string) => {
  const forgotPasswordToken = await signForgotPasswordTokenService(user_id)

  await UserModel.updateOne(
    {
      _id: new ObjectId(user_id as string)
    },
    {
      $set: {
        forgot_password_token: forgotPasswordToken,
        updatedAt: new Date()
      }
    }
  )

  // gửi email reset password

  return {
    forgot_password_token: forgotPasswordToken
  }
}

export const resetPasswordService = async (user_id: string, password: string) => {
  const hashedPassword = await hashPassword(password)

  const result = await UserModel.findByIdAndUpdate(
    {
      _id: new ObjectId(user_id as string)
    },
    {
      $set: { password: hashedPassword, forgot_password_token: '', updatedAt: new Date() }
    },
    { new: true }
  ).select('-password')

  return result
}
