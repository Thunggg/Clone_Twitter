import { Router } from 'express'
import { registerController } from '~/controllers/users.controller'
import { registerService } from '~/services/users.service'

export const usersRouter = Router()
usersRouter.post('/register', registerController)
