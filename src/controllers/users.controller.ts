import { registerReqBody } from '~/models/requests/User.request'
import { registerService } from '~/services/users.service'
import { NextFunction, Request, Response } from 'express'
import { ApiSuccess } from '~/utils/ApiSuccess'
import { ErrorCodes } from '~/constants/errorCodes'
import { ParamsDictionary } from 'express-serve-static-core'

export const registerController = async (
  req: Request<ParamsDictionary, any, registerReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await registerService(req.body)

  const response = new ApiSuccess(
    ErrorCodes.SUCCESS,
    'User registered successfully',
    201,
    result,
    new Date().toISOString()
  )

  res.status(201).json(response.toResponse())
}
