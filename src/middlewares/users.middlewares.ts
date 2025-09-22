import { checkSchema } from 'express-validator'
import { checkEmailExist } from '~/services/users.service'

export const validateRegister = checkSchema({
  username: {
    trim: true,
    notEmpty: { errorMessage: 'Name is required' },
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Name must be between 2-50 characters'
    }
  },
  email: {
    trim: true,
    notEmpty: { errorMessage: 'Email is required' },
    isEmail: { errorMessage: 'Invalid email' },
    custom: {
      options: (value: string) => {
        return checkEmailExist(value)
      }
    }
  },
  password: {
    trim: true,
    notEmpty: { errorMessage: 'Password is required' },
    isStrongPassword: {
      errorMessage:
        'Password must be at least 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character'
    }
  },
  confirm_password: {
    trim: true,
    notEmpty: { errorMessage: 'Confirm password is required' },
    isStrongPassword: {
      errorMessage:
        'Confirm password must be at least 8 characters, contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character'
    },
    custom: {
      options: (value: string, { req }) => {
        if (value != req.body.password) {
          throw new Error('Password and confirm password do not match')
        }
        return true
      }
    }
  },
  date_of_birth: {
    trim: true,
    notEmpty: { errorMessage: 'Date of birth is required' },
    isISO8601: {
      options: {
        strict: true,
        strictSeparator: true
      },
      errorMessage: 'Invalid date of birth'
    }
  }
})
