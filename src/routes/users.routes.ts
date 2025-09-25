import { Router } from 'express'
import { registerController } from '~/controllers/users.controller'
import { validateRegister } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

export const usersRouter = Router()
usersRouter.post('/register', validate(validateRegister), wrapRequestHandler(registerController))
