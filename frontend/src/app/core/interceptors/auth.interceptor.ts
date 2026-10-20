import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP para adjuntar el JWT a todas las peticiones al backend
 * y gestionar respuestas 401 de expiración de sesión
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Clonar la petición e inyectar cabecera Authorization si existe token
  let authReq = req;
  const isApiRequest = req.url.includes('/api/') || req.url.startsWith('/api');
  if (token && isApiRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde 401 y no es la petición de login inicial
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout('Tu sesión ha expirado en el servidor.');
      }
      return throwError(() => error);
    })
  );
};
