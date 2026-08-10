// middlewares/validateSchemaMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { AnyObjectSchema } from "yup";

export const validateSchema = (schema: AnyObjectSchema, property: "body" | "params" | "query" = "body") => {
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate(req[property], { abortEarly: false });
      next();
    } catch (err: any) {
      return res.status(400).json({ errors: err.errors });
    }
  };
};
