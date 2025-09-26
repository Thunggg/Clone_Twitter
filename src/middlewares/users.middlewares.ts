import { checkSchema } from 'express-validator'
import { HTTP_STATUS } from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { checkEmailExist, checkUsernameExist } from '~/services/users.service'

export const validateRegister = checkSchema({
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
          throw {
            message: USERS_MESSAGES.CONFIRM_PASSWORD_AND_PASSWORD_DO_NOT_MATCH,
            status: HTTP_STATUS.UNPROCESSABLE_ENTITY
          }
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
        if (value < new Date().toISOString()) {
          throw {
            message: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_BEFORE_TODAY,
            status: HTTP_STATUS.UNPROCESSABLE_ENTITY
          }
        }
        return true
      }
    }
  }
})
