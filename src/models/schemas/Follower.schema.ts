import mongoose, { InferSchemaType, Model, Schema } from 'mongoose'

const FollowerSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  follower_user_id: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  created_at: {
    type: Date,
    required: true
  }
})

type FollowerDoc = InferSchemaType<typeof FollowerSchema>
const FollowerModel: Model<FollowerDoc> = mongoose.model<FollowerDoc>('followers', FollowerSchema)
export default FollowerModel
