import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { SidebarComponent } from './shared/components/sidebar.component';
import { AuthService } from './core/services/auth.service';
import { UiStateService } from './core/services/ui-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="app-layout" [class.app-layout--authenticated]="auth.isAuthenticated()">
      <!-- Barra Superior Permanente -->
      <app-navbar></app-navbar>

      <!-- Layout Central para Usuarios Autenticados (Sidebar Maestro + Viewport) -->
      <div class="app-body" *ngIf="auth.isAuthenticated(); else unauthenticatedLayout">
        <app-sidebar></app-sidebar>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Layout de Pantalla Completa para Inicio de Sesión -->
      <ng-template #unauthenticatedLayout>
        <main class="main-content-full">
          <router-outlet></router-outlet>
        </main>
      </ng-template>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--titanium-50, #f8fafc);
    }

    .app-body {
      display: flex;
      flex: 1;
      min-height: calc(100vh - 68px);
      position: relative;
    }

    .main-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background: #f8fafc;
    }

    .main-content-full {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `],
})
export class AppComponent {
  auth = inject(AuthService);
  ui = inject(UiStateService);
}

