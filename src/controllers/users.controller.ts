import { registerReqBody } from '~/models/requests/User.request'
import { registerService } from '~/services/users.service'
import { NextFunction, Request, Response } from 'express'
import { ApiSuccess } from '~/utils/ApiSuccess'
import { ErrorCodes } from '~/utils/errorCodes'

export const registerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body as registerReqBody

    const result = await registerService(userData)

    const response = new ApiSuccess(
      ErrorCodes.SUCCESS,
      'User registered successfully',
      201,
      result,
      new Date().toISOString()
    )

    res.status(201).json(response.toResponse())
  } catch (error) {
    next(error)
  }
}
