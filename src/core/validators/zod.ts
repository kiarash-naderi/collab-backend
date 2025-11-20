import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (data: any) => {
    return schema.safeParse(data);
  };
};