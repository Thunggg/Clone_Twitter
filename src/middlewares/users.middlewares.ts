import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import UserModel from '~/models/schemas/User.schema'
import { checkEmailExist, checkUsernameExist } from '~/services/users.service'
import { comparePassword } from '~/utils/bcrypt'
import { AuthenticationError, AuthorizationError, NotFoundError } from '~/utils/CustomErrors'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { ObjectId } from 'mongodb'
import { TokenPayload } from '~/models/requests/User.request'
import FollowerModel from '~/models/schemas/Follower.schema'
import { REGEX_USERNAME } from '~/constants/regex'

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      // nếu không tồn tại forgot_password_token thì trả về lỗi
      if (!value) throw new AuthenticationError(USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED)

      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })

        const user = await UserModel.findOne({
          _id: new ObjectId(decoded_forgot_password_token.user_id as string),
          forgot_password_token: value
        })

        // nếu user không tồn tại
        if (!user) {
          throw new NotFoundError(USERS_MESSAGES.USER_NOT_FOUND)
        }

        // nếu forgot_password_token không khớp với forgot_password_token trong user
        if (user.forgot_password_token !== value) {
          throw new AuthenticationError(USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID)
        }

        ;(req as Request).user = user
        return true
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new AuthenticationError(error.message)
        }
        throw error
      }
    }
  }
}

const passwordSchema: ParamSchema = {
  trim: true,
  notEmpty: { errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED },
  isStrongPassword: {
    errorMessage:
      USERS_MESSAGES.PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS +
      USERS_MESSAGES.PASSWORD_MUST_CONTAIN_AT_LEAST_1_UPPERCASE_LETTER +
      USERS_MESSAGES.PASSWORD_MUST_CONTAIN_AT_LEAST_1_LOWERCASE_LETTER +
      USERS_MESSAGES.PASSWORD_MUST_CONTAIN_AT_LEAST_1_NUMBER +
      USERS_MESSAGES.PASSWORD_MUST_CONTAIN_AT_LEAST_1_SPECIAL_CHARACTER
  }
}

const confirmPasswordSchema: ParamSchema = {
  trim: true,
  notEmpty: { errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
  isStrongPassword: {
    errorMessage:
      USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_AT_LEAST_8_CHARACTERS +
      USERS_MESSAGES.CONFIRM_PASSWORD_MUST_CONTAIN_AT_LEAST_1_UPPERCASE_LETTER +
      USERS_MESSAGES.CONFIRM_PASSWORD_MUST_CONTAIN_AT_LEAST_1_LOWERCASE_LETTER +
      USERS_MESSAGES.CONFIRM_PASSWORD_MUST_CONTAIN_AT_LEAST_1_NUMBER +
      USERS_MESSAGES.CONFIRM_PASSWORD_MUST_CONTAIN_AT_LEAST_1_SPECIAL_CHARACTER
  },
  custom: {
    options: (value: string, { req }) => {
      if (value != req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_AND_PASSWORD_DO_NOT_MATCH)
      }
      return true
    }
  }
}

const nameSchema: ParamSchema = {
  trim: true,
  isLength: {
    options: { min: 3, max: 50 },
    errorMessage: USERS_MESSAGES.USER_NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
  }
}

const dateOfBirthSchema: ParamSchema = {
  trim: true,
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_INVALID
  },
  custom: {
    options: (value: string) => {
      const dob = new Date(value)
      const today = new Date()

      if (isNaN(dob.getTime())) throw new Error(USERS_MESSAGES.DATE_OF_BIRTH_IS_INVALID)

      if (dob > today) throw new Error(USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_BEFORE_TODAY)

      const age = today.getFullYear() - dob.getFullYear()
      if (age < 13) throw new Error(USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_13_YEARS_OR_OLDER)

      return true
    }
  }
}

const followerUserIdSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      // truyền lên có phải objectID ko
      if (!value || !ObjectId.isValid(value)) throw new NotFoundError(USERS_MESSAGES.USER_ID_IS_INVALID)

      // có tồn tại user ko
      const follower_user = await UserModel.findOne({
        _id: new ObjectId(value)
      })

      if (!follower_user) throw new NotFoundError(USERS_MESSAGES.USER_ID_IS_INVALID)
    }
  }
}

export const validateRegister = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED }
      },
      username: {
        notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED },
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: USERS_MESSAGES.USER_NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
        },
        trim: true,
        custom: {
          options: (value: string) => {
            return checkUsernameExist(value)
          }
        }
      },
      email: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
        custom: {
          options: (value: string) => {
            return checkEmailExist(value)
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: {
        ...dateOfBirthSchema,
        notEmpty: { errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED }
      }
    },
    ['body']
  )
)

export const validateLogin = validate(
  checkSchema(
    {
      email: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
        custom: {
          options: async (value: string, { req }) => {
            // so sánh theo email
            const user = await UserModel.findOne({
              email: value
            })

            if (!user) {
              throw new AuthenticationError(USERS_MESSAGES.WRONG_USERNAME_OR_PASSWORD)
            }

            // so sánh theo password
            const isMatch = await comparePassword(req.body.password, user.password)
            if (!isMatch) {
              throw new AuthenticationError(USERS_MESSAGES.WRONG_USERNAME_OR_PASSWORD)
            }

            ;(req as Request).user = user
            return true
          }
        }
      },
      password: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED }
      }
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      // trường authorization phải để trong header tên y chang vậy
      authorization: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            try {
              // kiểm tra có tồn tại authorization trong header không
              const auth = req.get('authorization')
              if (!auth) throw new AuthenticationError(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)

              // kiểm tra scheme có phải là Bearer không
              const [scheme, access_token] = auth.split(' ')
              if (scheme !== 'Bearer' || !access_token)
                throw new AuthenticationError(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)

              // kiểm tra có đúng token_type là AccessToken không
              const decoded = await verifyToken({
                token: access_token,
                privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              if (decoded.token_type !== TokenType.AccessToken)
                throw new AuthenticationError(USERS_MESSAGES.ACCESS_TOKEN_IS_INVALID)
              ;(req as Request).decode_authorization = decoded
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthenticationError(error.message)
              }
              throw error
            }
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const [decode_refresh_token, refresh_token] = await Promise.all([
                verifyToken({ token: value, privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                RefreshTokenModel.findOne({
                  token: value
                })
              ])

              // kiểm tra có đúng token_type là RefreshToken không
              if (decode_refresh_token.token_type !== TokenType.RefreshToken)
                throw new AuthenticationError(USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID)

              // kiểm tra refresh_token có tồn tại không
              if (!refresh_token) {
                throw new AuthenticationError(USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST)
              }

              ;(req as Request).decode_refresh_token = decode_refresh_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthenticationError(error.message)
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })

              // trường hợp token_type không phải là EmailVerifyToken
              if (decoded_email_verify_token.token_type !== TokenType.EmailVerifyToken)
                throw new AuthenticationError(USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID)

              // trường hợp chặn email_verify_token không khớp với email_verify_token trong user
              const user = await UserModel.findOne({
                _id: new ObjectId(decoded_email_verify_token.user_id as string)
              })

              if (!user) {
                throw new NotFoundError(USERS_MESSAGES.USER_NOT_FOUND)
              }

              if (user.email_verify_token !== value || user.verify !== UserVerifyStatus.Unverified) {
                throw new AuthenticationError(USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INVALID)
              }

              ;(req as Request).decode_email_verify_token = decoded_email_verify_token
              ;(req as Request).user = user

              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthenticationError(error.message)
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordTokenValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED },
        isEmail: { errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID },
        custom: {
          options: async (value: string, { req }) => {
            const user = await UserModel.findOne({ email: value })
            if (!user) {
              throw new NotFoundError(USERS_MESSAGES.USER_NOT_FOUND)
            }

            ;(req as Request).user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decode_authorization as TokenPayload

  if (verify !== UserVerifyStatus.Verified) {
    return next(new AuthorizationError(USERS_MESSAGES.USER_IS_NOT_VERIFIED))
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: { errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_BETWEEN_0_AND_200_CHARACTERS
        }
      },
      location: {
        optional: true,
        isString: { errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_BETWEEN_0_AND_200_CHARACTERS
        }
      },
      website: {
        optional: true,
        isString: { errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 200 },
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_BETWEEN_0_AND_200_CHARACTERS
        }
      },
      username: {
        optional: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: USERS_MESSAGES.USER_NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
        },
        trim: true,
        custom: {
          options: (value: string) => {
            if (!REGEX_USERNAME.test(value)) throw new Error(USERS_MESSAGES.USERNAME_IS_INVALID)

            return checkUsernameExist(value)
          }
        }
      },
      avatar: {
        optional: true,
        isString: { errorMessage: USERS_MESSAGES.AVATAR_MUST_BE_A_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: USERS_MESSAGES.AVATAR_MUST_BE_BETWEEN_0_AND_400_CHARACTERS
        }
      },
      cover_photo: {
        optional: true,
        isString: { errorMessage: USERS_MESSAGES.COVER_PHOTO_MUST_BE_A_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 400 },
          errorMessage: USERS_MESSAGES.COVER_PHOTO_MUST_BE_BETWEEN_0_AND_400_CHARACTERS
        }
      }
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      follower_user_id: followerUserIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      follower_user_id: followerUserIdSchema
    },
    ['params']
  )
)
