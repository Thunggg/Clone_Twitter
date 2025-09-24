import express from 'express'
import {
  ContextRunner,
  ErrorFormatter,
  FieldValidationError,
  Result,
  ValidationError,
  validationResult
} from 'express-validator'
import { ApiError } from './ApiError'
import { ErrorCodes } from './errorCodes'

export const validate = (validations: ContextRunner[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)))

    const formatter: ErrorFormatter<FieldValidationError> = (error) => {
      return error as FieldValidationError
    }

    const errors = validationResult(req).formatWith<FieldValidationError>(formatter)

    if (!errors.isEmpty()) {
      const formatedErrors = errors.array().map((error: FieldValidationError) => {
        return {
          field: error.path,
          message: error.msg,
          value: error.value
        }
      })

      const apiError = new ApiError(
        ErrorCodes.VALIDATION,
        'Validation error',
        400,
        new Date().toISOString(),
        formatedErrors
      )

      return res.status(400).json(apiError.toResponse())
    }
    next()
  }
}
