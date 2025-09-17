// import { UserVerifyStatus } from '~/constants/enums'

export default class User {
  // Đăng kí: username, email, date of birth, password
  // Đăng nhập: email và password
  username: string
  email: string
  date_of_birth: Date
  password: string

  // Xác thực email: jwt nếu chưa xác thực, '' khi đã xác thực
  email_verify_token: string

  // Quên mật khẩu: jwt nếu chưa xác thực, '' khi đã xác thực
  forgot_password_token: string

  // Thông tin người dùng có thể cập nhật thêm
  bio: string
  avatar: string
  cover_photo: string

  // Quản lý trạng thái tài khoản
  // verify: UserVerifyStatus

  // Quản lý thời gian tạo và cập nhập tài khoản
  created_at: Date
  updated_at: Date

  constructor({
    username,
    email,
    date_of_birth,
    password,
    email_verify_token,
    forgot_password_token,
    bio,
    avatar,
    cover_photo
    // verify
  }: {
    username: string
    email: string
    date_of_birth: Date
    password: string
    email_verify_token?: string
    forgot_password_token?: string
    bio?: string
    avatar?: string
    cover_photo?: string
    // verify?: UserVerifyStatus
  }) {
    const date = new Date()
    this.username = username
    this.email = email
    this.date_of_birth = date_of_birth
    this.password = password
    this.email_verify_token = email_verify_token || ''
    this.forgot_password_token = forgot_password_token || ''
    this.bio = bio || ''
    this.avatar = avatar || ''
    this.cover_photo = cover_photo || ''
    // this.verify = verify || UserVerifyStatus.Unverified
    this.created_at = date
    this.updated_at = date
  }
}
