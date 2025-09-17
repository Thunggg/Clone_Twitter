import { registerReqBody } from '~/models/requests/User.request'
import { registerService } from '~/services/users.service'
import { Request, Response } from 'express'

export const registerController = async (request: Request, result: Response) => {
  try {
    const res = await registerService(request.body as registerReqBody)
    result.status(201).json({
      message: 'Register successfully!',
      res
    })
  } catch (error) {
    console.log(error)
  }
}
