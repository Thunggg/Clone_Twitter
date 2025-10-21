import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/media.controller'
export const mediasRouter = Router()

mediasRouter.post('/upload-image', uploadSingleImageController)