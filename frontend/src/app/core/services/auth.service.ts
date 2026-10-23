import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map, catchError, of, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  station: string;
}

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // URL base de la API REST del backend
  private readonly baseUrl = '/api';

  // Constantes de sesión (30 minutos)
  private readonly INACTIVITY_LIMIT_SECONDS = 30 * 60; // 1800s = 30 minutos
  private readonly TOKEN_KEY = 'biotrace_jwt_token';
  private readonly USER_KEY = 'biotrace_user';
  private readonly LAST_ACTIVITY_KEY = 'biotrace_last_activity';

  // Signals reactivos para el estado de autenticación
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  isAuthenticated = computed(() => !!this.token() && !!this.currentUser());

  // Contador regresivo de inactividad (segundos restantes)
  secondsRemaining = signal<number>(this.INACTIVITY_LIMIT_SECONDS);
  timeRemainingFormatted = computed(() => {
    const total = this.secondsRemaining();
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  // Mensaje informativo (ej. al cerrarse por inactividad)
  sessionNotice = signal<string>('');

  // Identificadores de timers y listeners
  private intervalTimerId: any = null;
  private lastActivityTimestamp = Date.now();
  private activityListenerCleanup: (() => void) | null = null;
  private lastTokenRefreshTimestamp = Date.now();

  constructor() {
    // Si ya hay sesión guardada en localStorage, inicializar timers
    if (this.isAuthenticated()) {
      this.initInactivityTracker();
    }
  }

  /**
   * Inicio de sesión consumiendo la API REST con JWT
   */
  login(email: string, password: string): Observable<boolean> {
    this.sessionNotice.set('');

    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        this.saveSession(res.token, res.user);
        this.initInactivityTracker();
      }),
      catchError((error) => {
        // En caso de que el backend no tenga DB activa o falle, mensaje amigable
        const msg = error.error?.error || 'Error al autenticar credenciales en el servidor.';
        throw new Error(msg);
      }),
      map(() => true)
    );
  }

  /**
   * Guarda el token y usuario en localStorage y actualiza Signals
   */
  loginReadOnly(key: string): Observable<boolean> {
    return this.http.post<AuthResponse>(this.baseUrl + '/auth/read-only-session', {key}).pipe(
      tap(res => { this.saveSession(res.token,res.user); this.initInactivityTracker(); }),
      map(() => true), catchError(error => { throw new Error(error.error?.error || 'No se pudo abrir la consulta local.'); })
    );
  }
  private saveSession(jwtToken: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, jwtToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());

    this.token.set(jwtToken);
    this.currentUser.set(user);
    this.lastActivityTimestamp = Date.now();
    this.lastTokenRefreshTimestamp = Date.now();
    this.secondsRemaining.set(this.INACTIVITY_LIMIT_SECONDS);
  }

  /**
   * Inicializa el monitor de actividad e inactividad de 30 minutos
   */
  private initInactivityTracker() {
    this.stopInactivityTracker();

    // Ejecutar listeners fuera de Angular Zone para óptimo rendimiento sin ciclos innecesarios
    this.ngZone.runOutsideAngular(() => {
      const handleUserActivity = () => {
        const now = Date.now();
        // Control de frecuencia: actualiza actividad como máximo una vez cada 2 segundos
        if (now - this.lastActivityTimestamp > 2000) {
          this.lastActivityTimestamp = now;
          localStorage.setItem(this.LAST_ACTIVITY_KEY, now.toString());

          this.ngZone.run(() => {
            this.secondsRemaining.set(this.INACTIVITY_LIMIT_SECONDS);
          });

          // Si pasaron más de 10 minutos de uso continuo, renovar el token JWT en el backend
          if (now - this.lastTokenRefreshTimestamp > 10 * 60 * 1000) {
            this.refreshTokenInBackground();
          }
        }
      };

      const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
      events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

      this.activityListenerCleanup = () => {
        events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      };

      // Timer que decrementa cada segundo y evalúa inactividad
      this.intervalTimerId = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.lastActivityTimestamp) / 1000);
        const remaining = Math.max(0, this.INACTIVITY_LIMIT_SECONDS - elapsedSeconds);

        this.ngZone.run(() => {
          this.secondsRemaining.set(remaining);

          // Si alcanzó 0 segundos de inactividad, cerrar la sesión automáticamente
          if (remaining <= 0) {
            this.logout('Sesión cerrada automáticamente tras 30 minutos de inactividad.');
          }
        });
      }, 1000);
    });
  }

  /**
   * Renueva el token JWT en segundo plano para usuarios activos
   */
  private refreshTokenInBackground() {
    const currentToken = this.token();
    if (!currentToken) return;

    this.http.post<AuthResponse>(`${this.baseUrl}/auth/refresh`, { token: currentToken }).subscribe({
      next: (res) => {
        this.lastTokenRefreshTimestamp = Date.now();
        localStorage.setItem(this.TOKEN_KEY, res.token);
        this.token.set(res.token);
      },
      error: () => {
        // Silencioso; si expiró, el interceptor capturará el 401
      },
    });
  }

  /**
   * Detiene los listeners y temporizadores activos
   */
  private stopInactivityTracker() {
    if (this.intervalTimerId) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
    if (this.activityListenerCleanup) {
      this.activityListenerCleanup();
      this.activityListenerCleanup = null;
    }
  }

  /**
   * Cierre de sesión y limpieza integral de estado
   */
  logout(reason?: string) {
    this.stopInactivityTracker();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.LAST_ACTIVITY_KEY);

    this.token.set(null);
    this.currentUser.set(null);
    this.secondsRemaining.set(this.INACTIVITY_LIMIT_SECONDS);

    if (reason) {
      this.sessionNotice.set(reason);
    }

    this.router.navigate(['/login']);
  }

  /**
   * Recupera usuario almacenado en LocalStorage
   */
  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
}
