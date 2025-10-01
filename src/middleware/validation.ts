import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const createUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).required().trim(),
  lastName: Joi.string().min(1).max(100).required().trim(),
  birthday: Joi.date().iso().required(),
  location: Joi.string().min(1).max(200).required().trim(),
  timezone: Joi.string().min(1).max(50).required().trim(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(100).optional().trim(),
  lastName: Joi.string().min(1).max(100).optional().trim(),
  birthday: Joi.date().iso().optional(),
  location: Joi.string().min(1).max(200).optional().trim(),
  timezone: Joi.string().min(1).max(50).optional().trim(),
}).min(1); // At least one field must be provided

export const userIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }
    
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }
    
    next();
  };
};
