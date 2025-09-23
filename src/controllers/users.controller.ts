import { registerReqBody } from '~/models/requests/User.request'
import { registerService } from '~/services/users.service'
import { Request, Response } from 'express'
import { ApiSuccess } from '~/utils/ApiSuccess'
import { ErrorCodes } from '~/utils/errorCodes'
import { ApiError } from '~/utils/ApiError'

export const registerController = async (req: Request, res: Response) => {
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
    console.error('Registration error:', error)

    const response = new ApiError(
      ErrorCodes.INTERNAL,
      'Registration failed',
      500,
      new Date().toISOString(),
      process.env.NODE_ENV as string
    )

    // Proper error response
    res.status(500).json(response.toResponse)
  }
}
