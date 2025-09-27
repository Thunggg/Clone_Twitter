import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controller'
import { validateLogin, validateLogout, validateRegister } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

export const usersRouter = Router()
usersRouter.post('/register', validateRegister, wrapRequestHandler(registerController))
usersRouter.post('/login', validateLogin, wrapRequestHandler(loginController))
usersRouter.post(
  '/logout',
  validateLogout,
  wrapRequestHandler((req, res) => {
    res.json({ message: 'Logout success' })
  })
)
