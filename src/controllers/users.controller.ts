import { registerReqBody } from '~/models/requests/User.request'
import { registerService } from '~/services/users.service'
import { Request, Response } from 'express'

export const registerController = async (req: Request, res: Response) => {
  try {
    const userData = req.body as registerReqBody

    const result = await registerService(userData)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: result.insertedId,
        name: userData.username,
        email: userData.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)

    // Proper error response
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
