import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodSchema } from 'zod'

export type ValidationRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams extends Record<string, string> = Record<string, string>
> = Request<TParams, unknown, TBody, TQuery> & {
  validatedBody?: TBody
  validatedQuery?: TQuery
  validatedParams?: TParams
}

type ValidationTarget = 'body' | 'query' | 'params'

type ValidationConfig = Partial<Record<ValidationTarget, ZodSchema>>

function setValidatedValue(req: Request, target: ValidationTarget, value: unknown) {
  ;(req as any)[target] = value

  const validationRequest = req as ValidationRequest
  if (target === 'body') {
    validationRequest.validatedBody = value
  } else if (target === 'query') {
    validationRequest.validatedQuery = value
  } else {
    validationRequest.validatedParams = value as Record<string, string>
  }
}

function isValidationConfig(schemaOrConfig: ZodSchema | ValidationConfig): schemaOrConfig is ValidationConfig {
  return !('safeParse' in schemaOrConfig)
}

export function createZodValidator<T>(schema: ZodSchema<T>, target?: ValidationTarget): RequestHandler
export function createZodValidator(config: ValidationConfig): RequestHandler
export function createZodValidator<T>(
  schemaOrConfig: ZodSchema<T> | ValidationConfig,
  target: ValidationTarget = 'body'
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const entries = isValidationConfig(schemaOrConfig)
      ? Object.entries(schemaOrConfig)
      : [[target, schemaOrConfig] as const]

    for (const [validationTarget, schema] of entries) {
      if (!schema) continue

      const result = schema.safeParse((req as any)[validationTarget])

      if (!result.success) {
        res.status(400).json({
          error: {
            message: 'Validation failed',
            details: result.error.issues
          }
        })
        return
      }

      setValidatedValue(req, validationTarget as ValidationTarget, result.data)
    }

    next()
  }
}
