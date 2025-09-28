import mongoose, { Schema } from 'mongoose'

const RefreshTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    index: true
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

const RefreshTokenModel = mongoose.model('refresh_tokens', RefreshTokenSchema)

export default RefreshTokenModel
