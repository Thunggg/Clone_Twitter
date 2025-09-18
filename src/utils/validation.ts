import express from 'express'
import { ContextRunner, validationResult } from 'express-validator'

// can be reused by many routes
export const validate = (validations: ContextRunner[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // sequential processing, stops running validations chain if one fails.
    await Promise.all(validations.map((validation) => validation.run(req)))

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.mapped()
      })
    }
    next()
  }
}
