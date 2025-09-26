import { loginReqBody, registerReqBody } from '~/models/requests/User.request'
import { loginService, registerService } from '~/services/users.service'
import { NextFunction, Request, Response } from 'express'
import { ApiSuccess } from '~/utils/ApiSuccess'
import { ErrorCodes } from '~/constants/errorCodes'
import { ParamsDictionary } from 'express-serve-static-core'
import { USERS_MESSAGES } from '~/constants/messages'

export const registerController = async (req: Request<ParamsDictionary, any, registerReqBody>, res: Response) => {
  const result = await registerService(req.body)

  const response = new ApiSuccess(
    ErrorCodes.SUCCESS,
    USERS_MESSAGES.REGISER_SUCCESS,
    201,
    result,
    new Date().toISOString()
  )

  return res.status(201).json(response.toResponse())
}

export const loginController = async (req: Request<ParamsDictionary, any, loginReqBody>, res: Response) => {
  const { user } = req
  const { _id } = user

  const result = await loginService(_id.toString())

  const response = new ApiSuccess(
    ErrorCodes.SUCCESS,
    USERS_MESSAGES.LOGIN_SUCCESS,
    201,
    result,
    new Date().toISOString()
  )
  return res.status(201).json(response.toResponse())
}
