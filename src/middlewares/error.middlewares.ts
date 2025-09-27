import { NextFunction, Request, Response } from 'express'
import { MongoError, MongoServerError } from 'mongodb'
import { ApiError, ApiErrorResponseWithStatus } from '~/utils/ApiError'
import { ErrorCodes } from '~/constants/errorCodes'
import { HTTP_STATUS } from '~/constants/httpStatus'

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.log(err)
  // Xử lý MongoDB duplicate key error (email đã tồn tại)
  if ((err as MongoError).code === 11000) {
    const field = Object.keys((err as MongoServerError).keyPattern ?? {})[0]

    const formattedErrors = Object.keys((err as MongoServerError).keyPattern).map((field) => {
      return {
        field,
        message: `${field} already exists`,
        value: (err as MongoServerError).keyValue?.[field]
      }
    })

    return res
      .status(400)
      .json(
        new ApiError(
          ErrorCodes.CONFLICT,
          `${field} already exists`,
          400,
          new Date().toISOString(),
          formattedErrors
        ).toResponse()
      )
  }

  //default error
  const apiError = new ApiError(
    ErrorCodes.AUTHENTICATION,
    (err as ApiErrorResponseWithStatus).msg.message || 'Internal server error',
    (err as ApiErrorResponseWithStatus).msg.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    new Date().toISOString(),
    []
  )
  return res
    .status((err as ApiErrorResponseWithStatus).msg.status || HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(apiError.toResponse())
}
