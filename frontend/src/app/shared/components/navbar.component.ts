import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar" *ngIf="auth.isAuthenticated()">
      <div class="navbar-left">
        <!-- Botón Interactivo de Menú Lateral -->
        <button
          type="button"
          class="sidebar-menu-btn"
          (click)="ui.toggleSidebar()"
          [title]="ui.sidebarExpanded() ? 'Ocultar menú lateral' : 'Mostrar menú lateral'"
          aria-label="Alternar menú lateral"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="navbar-brand">
          <div class="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#06b6d4" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#ffffff" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#06b6d4" />
              <path d="M10 6.5h4M17.5 10v4M6.5 10v7.5a1 1 0 0 0 1 1H14" stroke="#06b6d4" stroke-linecap="round" />
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">BioTrace</span>
            <span class="brand-sub">DERMOCOSMÉTICA & FARMACÉUTICA</span>
          </div>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Estado DB Neon -->
        <div class="status-pill" [class.online]="isOnline()" [class.offline]="!isOnline()">
          <span class="dot"></span>
          <span>{{ isOnline() ? 'Neon PostgreSQL' : 'Conectando...' }}</span>
        </div>

        <!-- Temporizador de Sesión JWT (30m de inactividad) -->
        <div class="timer-pill" title="Tiempo restante antes de cierre por inactividad (30 min). Se reinicia con cada acción.">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span class="timer-text">{{ auth.timeRemainingFormatted() }}</span>
        </div>

        <!-- Perfil de Usuario Logueado -->
        <div class="user-badge" *ngIf="auth.currentUser() as user">
          <div class="avatar">{{ user.name.slice(0, 2) }}</div>
          <div class="user-details">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-role">{{ user.role }}</span>
          </div>
          <button class="logout-btn" (click)="auth.logout()" title="Cerrar Sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 68px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1.15rem;
    }
    .sidebar-menu-btn {
      width: 38px;
      height: 38px;
      border-radius: 9px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sidebar-menu-btn:hover {
      background: #ecfeff;
      border-color: #06b6d4;
      color: #0891b2;
      box-shadow: 0 0 8px rgba(6, 182, 212, 0.25);
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.95rem;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #0891b2;
    }
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .status-pill.online {
      background: #ecfeff;
      color: #0891b2;
      border-color: rgba(8, 145, 178, 0.25);
    }
    .status-pill.offline {
      background: #f1f5f9;
      color: #64748b;
      border-color: rgba(100, 116, 139, 0.25);
    }
    .status-pill .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }
    .timer-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: #0f172a;
      color: #ecfeff;
      border: 1px solid rgba(6, 182, 212, 0.35);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .timer-text {
      color: #06b6d4;
      font-family: monospace;
      font-size: 0.82rem;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 1.25rem;
      border-left: 1px solid #e2e8f0;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0f172a;
      color: #06b6d4;
      font-weight: 800;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #06b6d4;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.825rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .user-role {
      font-size: 0.68rem;
      color: #64748b;
      font-weight: 500;
    }
    .logout-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      margin-left: 0.25rem;
    }
    .logout-btn:hover {
      background: #ecfeff;
      color: #0891b2;
    }
  `],
})
export class NavbarComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  ui = inject(UiStateService);
  isOnline = signal<boolean>(false);

  ngOnInit() {
    this.api.getHealth().subscribe({
      next: (res) => this.isOnline.set(res.status === 'ok'),
      error: () => this.isOnline.set(false),
    });
  }
}
