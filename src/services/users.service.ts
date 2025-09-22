import User from '~/models/schemas/User.schema'
import databaseService from './database.service'
import { registerReqBody } from '~/models/requests/User.request'

export const registerService = async (reqBody: registerReqBody) => {
  return await databaseService.user.insertOne(
    new User({
      ...reqBody,
      date_of_birth: new Date(reqBody.date_of_birth),
      password: reqBody.password
    })
  )
}

export const checkEmailExist = async (email: string) => {
  const user = await databaseService.user.findOne({
    email: email
  })

  if (user) {
    throw new Error('Email already exists')
  }

  return true
}
