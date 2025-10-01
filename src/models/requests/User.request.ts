import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enum'
import { UserDoc } from '../schemas/User.schema'

export interface registerReqBody {
  username: string
  email: string
  date_of_birth: string
  password: string
}

export interface loginReqBody {
  user: UserDoc
  email: string
  password: string
}

export interface logoutReqBody {
  refresh_token: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
}

export interface emailVerifyReqBody {
  email_verify_token: string
}

export interface forgotPasswordReqBody {
  email: string
}

export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface updateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface followReqBody {
  follower_user_id: string
}
