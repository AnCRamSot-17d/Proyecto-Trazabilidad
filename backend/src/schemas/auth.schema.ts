import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('El correo institucional debe tener un formato válido (ej: usuario@biotrace.com)'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
