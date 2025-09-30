import {
  emailVerifyReqBody,
  forgotPasswordReqBody,
  loginReqBody,
  logoutReqBody,
  registerReqBody,
  resetPasswordReqBody,
  TokenPayload
} from '~/models/requests/User.request'
import {
  emailVerifyService,
  forgotPasswordService,
  loginService,
  registerService,
  resendVerifyEmailService,
  resetPasswordService
} from '~/services/users.service'
import { NextFunction, Request, Response } from 'express'
import { ApiSuccess } from '~/utils/ApiSuccess'
import { ErrorCodes } from '~/constants/errorCodes'
import { ParamsDictionary } from 'express-serve-static-core'
import { USERS_MESSAGES } from '~/constants/messages'
import RefreshTokenModel from '~/models/schemas/RefreshToken.schema'
import { AuthenticationError, ConflictError, NotFoundError } from '~/utils/CustomErrors'
import UserModel, { UserDoc } from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'

export const registerController = async (req: Request<ParamsDictionary, any, registerReqBody>, res: Response) => {
  const result = await registerService(req.body)

  const response = new ApiSuccess(
    ErrorCodes.SUCCESS,
    USERS_MESSAGES.REGISER_SUCCESS,
    201,
    result,
    new Date().toISOString()
  )

  return res.status(201).json(response.toResponse())
}

export const loginController = async (req: Request<ParamsDictionary, any, loginReqBody>, res: Response) => {
  const { user } = req
  const _id = user?._id.toString()

  const result = await loginService(_id as string)
  const response = new ApiSuccess(
    ErrorCodes.SUCCESS,
    USERS_MESSAGES.LOGIN_SUCCESS,
    200,
    result,
    new Date().toISOString()
  )
  return res.status(200).json(response.toResponse())
}

export const logoutController = async (req: Request<ParamsDictionary, any, logoutReqBody>, res: Response) => {
  const { refresh_token } = req.body

  const user_id_from_access_token = (req as Request).decode_authorization?.user_id
  const user_id_from_refresh_token = (req as Request).decode_refresh_token?.user_id
  if (
    !user_id_from_access_token ||
    !user_id_from_refresh_token ||
    user_id_from_access_token !== user_id_from_refresh_token
  )
    throw new AuthenticationError(USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID)

  // bên validate đã kiểm tra và chắc chắn có rồi nên ko cần check lại nữa
  // phải ràng buộc xóa chung với user_id để tránh bị hacker phá session của user
  await RefreshTokenModel.deleteOne({
    user_id: new ObjectId(user_id_from_access_token as string),
    token: refresh_token
  })

  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.LOGOUT_SUCCESS,
        200,
        null,
        new Date().toISOString()
      ).toResponse()
    )
}

export const emailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_email_verify_token as TokenPayload

  const user = await UserModel.findOne({
    _id: new ObjectId(user_id as string)
  })

  // nếu user không tồn tại
  if (!user) {
    throw new NotFoundError(USERS_MESSAGES.USER_NOT_FOUND)
  }

  // đã verify rồi thì mình ko thông báo lỗi
  // mà mình trả về status OK với message đã verify trước đó rồi
  if (user.email_verify_token === '') {
    return res
      .status(200)
      .json(
        new ApiSuccess(
          ErrorCodes.SUCCESS,
          USERS_MESSAGES.EMAIL_ALREADY_VERIFIED,
          200,
          null,
          new Date().toISOString()
        ).toResponse()
      )
  }

  const result = await emailVerifyService(user_id)

  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
        200,
        result,
        new Date().toISOString()
      ).toResponse()
    )
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as TokenPayload
  const user = req.user as UserDoc

  if (user.verify === UserVerifyStatus.Verified) {
    throw new ConflictError(USERS_MESSAGES.EMAIL_ALREADY_VERIFIED)
  }

  await resendVerifyEmailService(user_id)

  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.EMAIL_VERIFY_RESEND_SUCCESS,
        200,
        null,
        new Date().toISOString()
      ).toResponse()
    )
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, forgotPasswordReqBody>,
  res: Response
) => {
  const { _id } = req.user as UserDoc

  const result = await forgotPasswordService(_id.toString())

  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.FORGOT_PASSWORD_SUCCESS,
        200,
        result,
        new Date().toISOString()
      ).toResponse()
    )
}

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
  // ko cần xóa forgot_password_token vì có trường hợp user mở lên nhưng để đó hôm sau người ta mới vào đổi mật khẩu
  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS,
        200,
        null,
        new Date().toISOString()
      ).toResponse()
    )
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, resetPasswordReqBody>,
  res: Response
) => {
  const { _id } = req.user as UserDoc
  const { forgot_password_token, password, confirm_password } = req.body

  const result = await resetPasswordService(_id.toString(), password)

  return res
    .status(200)
    .json(
      new ApiSuccess(
        ErrorCodes.SUCCESS,
        USERS_MESSAGES.RESET_PASSWORD_SUCCESS,
        200,
        result,
        new Date().toISOString()
      ).toResponse()
    )
}
