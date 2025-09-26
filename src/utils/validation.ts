import express from 'express'
import { ContextRunner, ErrorFormatter, FieldValidationError, validationResult } from 'express-validator'
import { ApiError } from './ApiError'
import { ErrorCodes } from '../constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'

export const validate = (validations: ContextRunner[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const formatter: ErrorFormatter<FieldValidationError> = (error) => {
      return error as FieldValidationError
    }

    const errors = validationResult(req).formatWith<FieldValidationError>(formatter)

    for (const error of errors.array()) {
      if (error && error.msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(error)
      }
    }

    if (!errors.isEmpty()) {
      const formatedErrors = errors.array().map((error: FieldValidationError) => {
        const { message, status } = error.msg
        return {
          field: error.path,
          message,
          value: error.value
        }
      })

      const apiError = new ApiError(
        ErrorCodes.VALIDATION,
        'Validation error',
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        new Date().toISOString(),
        formatedErrors
      )

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(apiError.toResponse())
    }
  }
}
