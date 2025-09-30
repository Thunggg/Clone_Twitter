import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import UserModel from '~/models/schemas/User.schema'
import { checkEmailExist, checkUsernameExist } from '~/services/users.service'
import { comparePassword, hashPassword } from '~/utils/bcrypt'
import { AuthenticationError, NotFoundError } from '~/utils/CustomErrors'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { ObjectId } from 'mongodb'

export const validateRegister = validate(
  checkSchema(
    {
      username: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED },
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_BETWEEN_3_AND_50_CHARACTERS
        },
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
      password: {
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
      },
      confirm_password: {
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
      },
      date_of_birth: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED },
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

            req.user = user
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
