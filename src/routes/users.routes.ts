import { Router } from 'express'
import { registerController } from '~/controllers/users.controller'
import { validateRegister } from '~/middlewares/users.middlewares'
import { registerService } from '~/services/users.service'
import { validate } from '~/utils/validation'

export const usersRouter = Router()
usersRouter.post('/register', validate(validateRegister), registerController)
