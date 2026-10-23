import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente de Autenticación con CSS Grid Responsive y Tokens JWT (30 min)
 * Diseño a medida: Tarjetas proporcionadas, 1 solo perfil de pruebas e imagen de laboratorio con opacidad
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page-wrapper">
      
      <!-- Resplandor sutil cian glacial sobre el fondo -->
      <div class="glow-backdrop"></div>

      <!-- Contenedor Maestro CSS Grid (Perfectamente proporcionado y balanceado) -->
      <main class="login-grid-container">
        
        <!-- ========================================== -->
        <!-- COLUMNA 1: Información Concisa de la App   -->
        <!-- ========================================== -->
        <section class="branding-card">
          <div class="brand-top">
            <div class="brand-header">
              <div class="brand-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#06b6d4" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#ffffff" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#06b6d4" />
                  <path d="M10 6.5h4M17.5 10v4M6.5 10v7.5a1 1 0 0 0 1 1H14" stroke="#06b6d4" stroke-linecap="round" />
                </svg>
              </div>
              <div>
                <h1 class="brand-title">BioTrace</h1>
                <span class="brand-tag">TRAZABILIDAD DERMO-FARMACÉUTICA</span>
              </div>
            </div>

            <p class="brand-pitch">
              Control integral de formulación, calidad y genealogía de lotes para cosméticos y fármacos.
            </p>

            <!-- 3 Puntos Clave Concisos (Ajustados a la medida de la tarjeta) -->
            <div class="pillars-list">
              <div class="pillar-row">
                <span class="pillar-dot"></span>
                <div>
                  <strong>Trazabilidad 360°</strong>
                  <p>Rastreo ascendente y descendente de cada lote.</p>
                </div>
              </div>

              <div class="pillar-row">
                <span class="pillar-dot"></span>
                <div>
                  <strong>Formulación & Insumos</strong>
                  <p>Balance estricto de materias primas sin mermas.</p>
                </div>
              </div>

              <div class="pillar-row">
                <span class="pillar-dot"></span>
                <div>
                  <strong>Liberación de Calidad</strong>
                  <p>Dictamen oficial bajo normativa GMP / BPM.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pie del Panel -->
          <div class="brand-footer">
            <span class="footer-tag">Cosméticos • Dermocosmética • Farmacéutica</span>
          </div>
        </section>

        <!-- ========================================== -->
        <!-- COLUMNA 2: Formulario de Acceso a Medida   -->
        <!-- ========================================== -->
        <section class="auth-card">
          <div class="auth-header">
            <h3>Iniciar Sesión</h3>
            <p>Ingresa a tu estación de trabajo autorizada.</p>
          </div>

          <!-- Banner Informativo de Sesión Expirada (por inactividad 30m) -->
          <div *ngIf="auth.sessionNotice()" class="notice-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>{{ auth.sessionNotice() }}</span>
          </div>

          <!-- Alerta de Credenciales Incorrectas -->
          <div *ngIf="errorMessage()" class="alert-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>

          <form (ngSubmit)="handleLogin()" class="form-grid">
            <label class="field-label"><input type="checkbox" name="readOnlyAccess" [(ngModel)]="readOnlyAccess"> Consulta local de solo lectura</label>
            <p *ngIf="readOnlyAccess">Utiliza la clave local de consulta. Este acceso no permite guardar ni modificar registros.</p>
            
            <!-- Campo: Correo Institucional -->
            <div class="field-group">
              <label class="field-label" for="emailInput">Correo Institucional o Usuario</label>
              <div class="input-container">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="emailInput"
                  type="email"
                  class="text-input"
                  [(ngModel)]="email"
                  name="email"
                  [required]="!readOnlyAccess"
                  placeholder="ejemplo@biotrace.com"
                  [disabled]="isLoading()"
                />
              </div>
            </div>

            <!-- Campo: Contraseña con Toggle de Visibilidad -->
            <div class="field-group">
              <div class="field-label-row">
                <label class="field-label" for="passwordInput">{{ readOnlyAccess ? 'Clave local de consulta' : 'Contraseña' }}</label>
                <span class="token-hint">Estación Autorizada</span>
              </div>
              <div class="input-container">
                <span class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="passwordInput"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="text-input"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  [disabled]="isLoading()"
                />
                <button
                  type="button"
                  class="eye-btn"
                  (click)="togglePasswordVisibility()"
                  tabindex="-1"
                  aria-label="Ver u ocultar contraseña"
                >
                  <svg *ngIf="!showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg *ngIf="showPassword()" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Botón Principal -->
            <button
              type="submit"
              class="submit-button"
              [disabled]="isLoading()"
            >
              <span *ngIf="!isLoading()">Autenticar & Entrar</span>
              <span *ngIf="isLoading()" class="loading-wrap">
                <span class="spinner-circle"></span>
                Validando credenciales...
              </span>
            </button>
          </form>
        </section>

      </main>

    </div>
  `,
  styles: [`
    /* ======================================================== */
    /* 1. FONDO CON IMAGEN DE LABORATORIO Y OPACIDAD TITANIO   */
    /* ======================================================== */
    .login-page-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Imagen real del laboratorio con gradiente en titanio oscuro y opacidad calibrada */
      background: 
        linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(9, 13, 22, 0.92) 100%),
        url('/images/pharma_lab_bg.jpg') center / cover no-repeat fixed;
      padding: 1.5rem 1.25rem;
      position: relative;
      overflow: hidden;
    }

    .glow-backdrop {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    /* ======================================================== */
    /* 2. REJILLA CSS GRID A MEDIDA (SIN ESPACIOS DESPERDICIADOS)*/
    /* ======================================================== */
    .login-grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      max-width: 900px; /* Tamaño equilibrado para que no sobre espacio */
      width: 100%;
      z-index: 10;
      align-items: stretch;
      animation: gridFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes gridFadeIn {
      from { opacity: 0; transform: scale(0.98) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 840px) {
      .login-grid-container {
        grid-template-columns: 1fr;
        max-width: 440px;
      }
      .branding-card {
        display: none !important;
      }
    }

    /* ======================================================== */
    /* 3. COLUMNA 1: TARJETA DE MARCA CON GLASSMORPHISM OSCURO  */
    /* ======================================================== */
    .branding-card {
      background: rgba(15, 23, 42, 0.82);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(6, 182, 212, 0.28);
      border-radius: 18px;
      padding: 2.25rem 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 1.15rem;
    }

    .brand-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #1e293b;
      border: 1px solid rgba(6, 182, 212, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }

    .brand-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.03em;
      margin: 0;
      line-height: 1.1;
    }

    .brand-tag {
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #06b6d4;
    }

    .brand-pitch {
      font-size: 0.875rem;
      color: #cbd5e1;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }

    .pillars-list {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .pillar-row {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .pillar-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
      margin-top: 5px;
      flex-shrink: 0;
    }

    .pillar-row strong {
      display: block;
      font-size: 0.825rem;
      color: #f8fafc;
      font-weight: 600;
      margin-bottom: 0.15rem;
    }

    .pillar-row p {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.35;
    }

    .brand-footer {
      padding-top: 1.25rem;
      border-top: 1px solid rgba(226, 232, 240, 0.12);
      margin-top: 1.5rem;
    }

    .footer-tag {
      font-size: 0.68rem;
      color: #06b6d4;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* ======================================================== */
    /* 4. COLUMNA 2: TARJETA DE FORMULARIO A MEDIDA             */
    /* ======================================================== */
    .auth-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(226, 232, 240, 0.85);
      border-radius: 18px;
      padding: 2.25rem 2rem;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .auth-header {
      margin-bottom: 1.35rem;
    }

    .auth-header h3 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
    }

    .auth-header p {
      font-size: 0.825rem;
      color: #64748b;
    }

    .notice-box, .alert-box {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: #0f172a;
      border: 1px solid rgba(6, 182, 212, 0.35);
      color: #ecfeff;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      font-size: 0.775rem;
      font-weight: 500;
      margin-bottom: 1rem;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .field-group {
      display: flex;
      flex-direction: column;
    }

    .field-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 0.35rem;
    }

    .field-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
    }

    .field-label-row .field-label {
      margin-bottom: 0;
    }

    .token-hint {
      font-size: 0.68rem;
      font-weight: 600;
      color: #0891b2;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      pointer-events: none;
    }

    .text-input {
      width: 100%;
      padding: 0.7rem 2.6rem 0.7rem 2.6rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.875rem;
      color: #0f172a;
      background: #f8fafc;
      transition: all 0.2s ease;
    }

    .text-input:focus {
      outline: none;
      background: #ffffff;
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.18);
    }

    .eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.15s ease;
    }

    .eye-btn:hover {
      color: #0f172a;
    }

    .submit-button {
      width: 100%;
      height: 48px;
      min-height: 48px;
      padding: 0 1.25rem;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid rgba(6, 182, 212, 0.35);
      border-radius: 10px;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
      margin-top: 0.5rem;
      line-height: 1;
      box-sizing: border-box;
      user-select: none;
      transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
    }

    .submit-button:hover:not(:disabled) {
      background: #1e293b;
      border-color: #06b6d4;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.4);
    }

    .submit-button:disabled {
      opacity: 0.75;
      cursor: not-allowed;
    }

    .loading-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      line-height: 1;
    }

    .spinner-circle {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.25);
      border-top-color: #06b6d4;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  readOnlyAccess = false;
  email = '';
  password = '';
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  handleLogin() {
    if (this.isLoading()) return;

    if ((!this.readOnlyAccess && !this.email.trim()) || !this.password.trim()) {
      this.errorMessage.set('Por favor ingresa tu usuario institucional y contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    (this.readOnlyAccess ? this.auth.loginReadOnly(this.password.trim()) : this.auth.login(this.email.trim(), this.password.trim())).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Error al autenticar credenciales.');
      },
    });
  }
}
