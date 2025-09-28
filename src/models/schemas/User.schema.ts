import mongoose, { InferSchemaType, Model, Schema } from 'mongoose'
import { UserVerifyStatus } from '~/constants/enum'

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
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
    },
    verify: {
      type: Number,
      default: UserVerifyStatus.Unverified
    }
  },
  { timestamps: true }
)
export type UserDoc = InferSchemaType<typeof UserSchema>
const UserModel: Model<UserDoc> = mongoose.model<UserDoc>('users', UserSchema)

export default UserModel
