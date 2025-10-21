import { Router } from 'express'
import { uploadSingleImageController } from '~/controllers/media.controller'
import { wrapRequestHandler } from '~/utils/handlers'
export const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapRequestHandler(uploadSingleImageController))