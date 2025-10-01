import { Router } from 'express'
import {
  emailVerifyController,
  forgotPasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  resetPasswordController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/users.controller'
import { filterMiddleware } from '~/middlewares/common.middleweares'
import {
  validateLogin,
  accessTokenValidator,
  validateRegister,
  refreshTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordTokenValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordTokenValidator,
  verifiedUserValidator,
  updateMeValidator
} from '~/middlewares/users.middlewares'
import { updateMeReqBody } from '~/models/requests/User.request'
import { wrapRequestHandler } from '~/utils/handlers'

export const usersRouter = Router()

/*
 * Description: Đăng ký tài khoản mới, tạo user và trả về access/refresh token.
 * Path: POST /users/register
 * Method: POST
 * Header: Content-Type: application/json
 * Body:
 * - username: string (3-50 ký tự)
 * - email: string (định dạng email)
 * - password: string (mạnh, >= 8 ký tự)
 * - confirm_password: string (khớp với password)
 * - date_of_birth: string (ISO 8601)
 */
usersRouter.post('/register', validateRegister, wrapRequestHandler(registerController))

/*
 * Description: Đăng nhập bằng email và password, trả về access/refresh token.
 * Path: POST /users/login
 * Method: POST
 * Header: Content-Type: application/json
 * Body:
 * - email: string
 * - password: string
 */
usersRouter.post('/login', validateLogin, wrapRequestHandler(loginController))

/*
 * Description: Đăng xuất, thu hồi refresh_token hiện tại.
 * Path: POST /users/logout
 * Method: POST
 * Header: Authorization: Bearer <access_token>; Content-Type: application/json
 * Body:
 * - refresh_token: string
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/*
 * Description: Xác thực email bằng email_verify_token, cập nhật trạng thái verify và phát hành cặp token mới.
 * Path: POST /users/verify-email
 * Method: POST
 * Header: Content-Type: application/json
 * Body:
 * - email_verify_token: string
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))

/*
 * Description: Gửi lại email xác thực.
 * Path: POST /users/resend-verify-email
 * Method: POST
 * Header: Authorization: Bearer <access_token>
 * Body: {}
 */
usersRouter.post(
  '/resend-verify-email',
  accessTokenValidator,
  emailVerifyTokenValidator,
  wrapRequestHandler(resendEmailVerifyController)
)

/**
 * Description: Submit email to reset password
 * Path: GET /forgot-password
 * Method: POST
 * Body: {email: string}
 */
usersRouter.post('/forgot-password', forgotPasswordTokenValidator, wrapRequestHandler(forgotPasswordController))

/*
 * Description: Verify forgot password token
 * Path: POST /verify-forgot-password
 * Method: POST
 * Body: {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/*
 * Description: Reset password
 * Path: POST /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, new_password: string, confirm_new_password: string}
 */
usersRouter.post('/reset-password', resetPasswordTokenValidator, wrapRequestHandler(resetPasswordController))

/*
 * Description: Get user info
 * Path: POST /me
 * Method: POST
 * Header: Authorization: Bearer <access_token>
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/*
 * Description: Update user info
 * Path: PATCH /me
 * Method: PATCH
 * Header: Authorization: Bearer <access_token>
 * Body: {username: string, email: string, date_of_birth: string, bio: string, avatar: string, cover_photo: string}
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<updateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)
