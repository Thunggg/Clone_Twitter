import User from '~/models/schemas/User.schema'
import { registerReqBody } from '~/models/requests/User.request'
import UserModel from '~/models/schemas/User.schema'

export const registerService = async (reqBody: registerReqBody) => {
  const newUser = new User({
    ...reqBody,
    date_of_birth: new Date(reqBody.date_of_birth),
    password: reqBody.password
  })

  await UserModel.create(newUser)

  return newUser
}

export const checkEmailExist = async (email: string) => {
  const user = await UserModel.findOne({
    email: email
  })

  if (user) {
    throw new Error('Email already exists')
  }

  return true
}
