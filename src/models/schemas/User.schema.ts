// import { UserVerifyStatus } from '~/constants/enums'

import mongoose, { Schema } from 'mongoose'

interface IUser extends Document {
  username: string
  email: string
  date_of_birth: Date
  password: string
  email_verify_token: string
  forgot_password_token: string
  bio: string
  avatar: string
  cover_photo: string
  // verify: UserVerifyStatus
  created_at: Date
  updated_at: Date
}

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      index: true
    },
    date_of_birth: {
      type: Date,
      required: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    email_verify_token: {
      type: String,
      default: ''
    },
    forgot_password_token: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    cover_photo: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

const UserModel = mongoose.model<IUser>('users', UserSchema)

export default UserModel
