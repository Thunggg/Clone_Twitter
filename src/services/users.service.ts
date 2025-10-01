import { registerReqBody, updateMeReqBody } from '~/models/requests/User.request'
import UserModel from '~/models/schemas/User.schema'
import { hashPassword } from '~/utils/bcrypt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { signToken } from '~/utils/jwt'
import type { StringValue } from 'ms'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import { ConflictError } from '~/utils/CustomErrors'
import { ObjectId } from 'mongodb'
import FollowerModel from '~/models/schemas/Follower.schema'

export const registerService = async (reqBody: registerReqBody) => {
  const _id = new ObjectId()
  const user_id = _id.toString()

  const emailVerifyToken = await signEmailVerifyTokenService({ user_id, verify: UserVerifyStatus.Unverified })

  const newUser = await UserModel.create({
    ...reqBody,
    _id,
    email_verify_token: emailVerifyToken,
    date_of_birth: new Date(reqBody.date_of_birth),
    password: await hashPassword(reqBody.password)
  })

  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService({ user_id, verify: UserVerifyStatus.Unverified }),
    signRefreshTokenService({ user_id, verify: UserVerifyStatus.Unverified })
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

export const signAccessTokenService = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
  return signToken({
    payload: {
      user_id,
      verify,
      token_type: TokenType.AccessToken
    },
    privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
    options: {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as StringValue
    }
  })
}

export const signRefreshTokenService = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
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

export const signEmailVerifyTokenService = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
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

export const signForgotPasswordTokenService = ({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) => {
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

export const loginService = async (user_id: string, verify: UserVerifyStatus) => {
  const [access_token, refresh_token] = await Promise.all([
    signAccessTokenService({ user_id, verify }),
    signRefreshTokenService({ user_id, verify })
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
    signAccessTokenService({ user_id, verify: UserVerifyStatus.Verified }),
    signRefreshTokenService({ user_id, verify: UserVerifyStatus.Verified }),
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
  const emailVerifyToken = await signEmailVerifyTokenService({ user_id, verify: UserVerifyStatus.Unverified })

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

export const forgotPasswordService = async (user_id: string, verify: UserVerifyStatus) => {
  const forgotPasswordToken = await signForgotPasswordTokenService({ user_id, verify })

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
  ).select('-password -email_verify_token -forgot_password_token')

  return result
}

export const getMeService = async (user_id: string) => {
  const user = await UserModel.findById(user_id).select('-password -email_verify_token -forgot_password_token')

  return user
}

export const updateMeService = async (user_id: string, updateData: updateMeReqBody) => {
  const date_of_birth = updateData.date_of_birth ? new Date(updateData.date_of_birth) : updateData.date_of_birth

  const user = await UserModel.findOneAndUpdate(
    {
      _id: new ObjectId(user_id as string)
    },
    {
      $set: {
        ...updateData,
        date_of_birth: date_of_birth,
        updatedAt: new Date()
      }
    },
    { new: true, runValidators: false }
  ).select('-password -email_verify_token -forgot_password_token')

  return user
}

export const followUserService = async (user_id: string, follower_user_id: string) => {
  // ko thể tự follow chính bản thân mình
  if (user_id === follower_user_id) throw new ConflictError(USERS_MESSAGES.USER_ID_IS_INVALID)

  // kiểm tra xem user đã follow người đó rồi hay chưa
  const isFollowed = await FollowerModel.findOne({
    user_id: new ObjectId(user_id),
    follower_user_id: new ObjectId(follower_user_id)
  })

  let result

  // nếu đã follow rồi thì không thể follow lại
  if (isFollowed) {
    throw new ConflictError(USERS_MESSAGES.USER_ID_IS_INVALID)
  } else {
    result = await FollowerModel.create({
      user_id: new ObjectId(user_id),
      follower_user_id: new ObjectId(follower_user_id),
      created_at: new Date()
    })
  }

  return result.toObject()
}

export const unfollowUserService = async (user_id: string, follower_user_id: string) => {
  const isFollowed = await FollowerModel.findOne({
    user_id: new ObjectId(user_id),
    follower_user_id: new ObjectId(follower_user_id)
  })

  let result

  // nếu chưa follow thì không thể unfollow
  if (!isFollowed) {
    throw new ConflictError(USERS_MESSAGES.ALREADY_UNFOLLOWED)
  } else {
    result = await FollowerModel.deleteOne({
      user_id: new ObjectId(user_id),
      follower_user_id: new ObjectId(follower_user_id)
    })
  }

  return result
}
