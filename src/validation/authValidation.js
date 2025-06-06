import { z } from 'zod';

export const signUpValidator = z.object({
  firstname: z.string(),
  lastname: z.string(),
  password: z
    .string()
    .min(8, { message: 'Password should be at least 8 characters long' })
    .max(12, { message: 'Password should not exceed 12 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/, {
      message: 'Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    }),
  confirmPassword:z.string()
  .min(8, { message: 'Password should be at least 8 characters long' })
  .max(12, { message: 'Password should not exceed 12 characters' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/, {
    message: 'Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }),
  email: z.string().min(3).max(30)
}).required({ message: 'Please enter all the required fields' });


export const signInValidator = z.object({
  email: z.string(),
  password: z.string().min(8).max(12),
}).required({ message: 'Please enter all the required fields' });
