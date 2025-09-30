import { JwtPayload } from 'jsonwebtoken'
import { TokenType } from '~/constants/enum'

export interface registerReqBody {
  username: string
  email: string
  date_of_birth: string
  password: string
}

export interface loginReqBody {
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
