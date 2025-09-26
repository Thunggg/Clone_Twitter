import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { validateLogin, validateRegister } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

export const usersRouter = Router()
usersRouter.post('/register', validateRegister, wrapRequestHandler(registerController))
usersRouter.post('/login', validateLogin, wrapRequestHandler(loginController))
