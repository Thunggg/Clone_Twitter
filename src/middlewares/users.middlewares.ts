import { checkSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/messages'
import UserModel from '~/models/schemas/User.schema'
import { checkEmailExist, checkUsernameExist } from '~/services/users.service'
import { comparePassword, hashPassword } from '~/utils/bcrypt'
import { AuthenticationError } from '~/utils/CustomErrors'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

export const validateRegister = validate(
  checkSchema(
    {
      username: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED },
        isLength: {
          options: { min: 2, max: 50 },
          errorMessage: USERS_MESSAGES.NAME_MUST_BE_BETWEEN_2_AND_50_CHARACTERS
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
              return Promise.reject(USERS_MESSAGES.CONFIRM_PASSWORD_AND_PASSWORD_DO_NOT_MATCH)
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
            if (value > new Date().toISOString().split('T')[0]) {
              return Promise.reject(USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_BEFORE_TODAY)
            }
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
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      // trường Authorization phải để trong header tên y chang vậy
      Authorization: {
        trim: true,
        notEmpty: { errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]

            if (!access_token) {
              throw new AuthenticationError(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)
            }

            const decoded_authorization = await verifyToken({ access_token })
            req.authorization = decoded_authorization
            return true
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
            if (!value) {
              throw new AuthenticationError(USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED)
            }
          }
        }
      }
    },
    ['body']
  )
)
