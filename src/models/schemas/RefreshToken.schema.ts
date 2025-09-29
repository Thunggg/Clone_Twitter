import mongoose, { InferSchemaType, Model, Schema } from 'mongoose'

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  created_at: {
    type: Date,
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  }
})

type RefreshTokenDoc = InferSchemaType<typeof RefreshTokenSchema>
const RefreshTokenModel: Model<RefreshTokenDoc> = mongoose.model<RefreshTokenDoc>('refresh_tokens', RefreshTokenSchema)

export default RefreshTokenModel
