import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiStateService, SubViewTab } from '../../core/services/ui-state.service';
import { AuthService } from '../../core/services/auth.service';

interface SubStation {
  key: string;
  label: string;
  hasTabs?: boolean;
}

interface ModuleGroup {
  key: string;
  title: string;
  iconSvg: string;
  subStations: SubStation[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside
      class="sidebar-master"
      [class.sidebar--collapsed]="!ui.sidebarExpanded()"
      *ngIf="auth.isAuthenticated()"
    >
      <!-- Encabezado del Menú Lateral -->
      <div class="sidebar-header">
        <div class="brand-mini" *ngIf="ui.sidebarExpanded()">
          <span class="brand-tag">NAVEGACIÓN INDUSTRIAL</span>
          <span class="brand-title">Módulos & Estaciones</span>
        </div>

        <!-- Botón interactivo de colapsar / expandir -->
        <button
          type="button"
          class="collapse-toggle-btn"
          (click)="ui.toggleSidebar()"
          [title]="ui.sidebarExpanded() ? 'Plegar menú lateral' : 'Desplegar menú lateral'"
          aria-label="Alternar menú lateral"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            [style.transform]="ui.sidebarExpanded() ? 'rotate(0deg)' : 'rotate(180deg)'"
            class="toggle-arrow"
          >
            <polyline points="11 17 6 12 11 7"></polyline>
            <polyline points="18 17 13 12 18 7"></polyline>
          </svg>
        </button>
      </div>

      <!-- Buscador rápido dentro del árbol (solo en modo expandido) -->
      <div class="sidebar-search-box" *ngIf="ui.sidebarExpanded()">
        <div class="search-input-wrapper">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchFilter"
            placeholder="Buscar estación o ventana..."
            class="sidebar-search-input"
          />
          <button
            *ngIf="searchFilter"
            (click)="searchFilter = ''"
            class="clear-search-btn"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Contenedor con Scroll Suave de Módulos y Estaciones -->
      <nav class="sidebar-content">
        
        <!-- ============================================== -->
        <!-- 1. BOTÓN PRINCIPAL: PANEL DE CONTROL / INICIO -->
        <!-- ============================================== -->
        <button
          type="button"
          (click)="selectModule('inicio')"
          class="nav-root-item"
          [class.nav-root-item--active]="ui.activeModule() === 'inicio'"
          title="Panel Principal"
        >
          <div class="item-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <span class="item-label" *ngIf="ui.sidebarExpanded()">Panel Principal</span>
          <span class="active-glow-pip" *ngIf="ui.activeModule() === 'inicio'"></span>
        </button>

        <div class="section-divider" *ngIf="ui.sidebarExpanded()">
          <span>ESTACIONES DE TRAZABILIDAD</span>
        </div>

        <!-- ============================================== -->
        <!-- MÓDULOS AGRUPADOS (ACORDEÓN INTERACTIVO)       -->
        <!-- ============================================== -->
        <div class="module-group" *ngFor="let group of filteredGroups()">
          
          <!-- Encabezado del Grupo (Botón Interactivo Acordeón) -->
          <button
            type="button"
            class="group-header-btn"
            [class.group-header-btn--active]="isGroupActive(group.key)"
            (click)="toggleGroup(group.key)"
            [title]="group.title"
          >
            <div class="header-left">
              <span class="group-icon" [innerHTML]="group.iconSvg"></span>
              <span class="group-title" *ngIf="ui.sidebarExpanded()">{{ group.title }}</span>
            </div>

            <svg
              *ngIf="ui.sidebarExpanded()"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="chevron-indicator"
              [class.chevron--expanded]="isGroupOpen(group.key)"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Sub-estaciones desplegables (Solo si está abierto y expandido) -->
          <div class="group-children" *ngIf="ui.sidebarExpanded() && isGroupOpen(group.key)">
            
            <div class="substation-block" *ngFor="let sub of group.subStations">
              
              <!-- Título de la sub-estación -->
              <div class="substation-title-row">
                <span class="substation-bullet"></span>
                <span class="substation-name">{{ sub.label }}</span>
              </div>

              <!-- Botones Interactivos de Ventana: Llenar Formato vs Ver Registros -->
              <div class="action-buttons-grid" *ngIf="sub.hasTabs !== false">
                <button
                  type="button"
                  class="action-subitem-btn"
                  [class.action-subitem--active]="ui.activeModule() === sub.key && ui.activeTab() === 'form'"
                  (click)="selectSubStation(sub.key, 'form')"
                  title="Abrir formulario para registrar nuevo elemento"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>Llenar formato</span>
                </button>

                <button
                  type="button"
                  class="action-subitem-btn"
                  [class.action-subitem--active]="ui.activeModule() === sub.key && ui.activeTab() === 'list'"
                  (click)="selectSubStation(sub.key, 'list')"
                  title="Ver tabla y registros históricos"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Ver registros</span>
                </button>
              </div>

              <!-- Botón Directo para módulos sin pestañas de form/list -->
              <div class="action-direct-box" *ngIf="sub.hasTabs === false">
                <button
                  type="button"
                  class="action-direct-btn"
                  [class.action-subitem--active]="ui.activeModule() === sub.key"
                  (click)="selectSubStation(sub.key, 'list')"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  <span>Consultar</span>
                </button>
              </div>

            </div>

          </div>

        </div>

      </nav>

      <!-- Pie del Menú Lateral -->
      <div class="sidebar-footer" *ngIf="ui.sidebarExpanded()">
        <div class="footer-badge">
          <span class="gmp-dot"></span>
          <span class="footer-text">GMP / BPM VALIDADO</span>
        </div>
        <span class="version-label">v1.2.0 • Titanio</span>
      </div>
    </aside>
  `,
  styles: [`
    /* ======================================================== */
    /* MENÚ LATERAL INDUSTRIAL (TITANIO & CIAN GLACIAL)         */
    /* ======================================================== */
    :host {
      display: block;
      z-index: 80;
    }

    .sidebar-master {
      width: 275px;
      height: calc(100vh - 68px);
      position: sticky;
      top: 68px;
      background: #0f172a; /* Titanio Profundo Principal */
      border-right: 1px solid rgba(6, 182, 212, 0.18);
      display: flex;
      flex-direction: column;
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      box-shadow: 2px 0 16px rgba(0, 0, 0, 0.25);
    }

    .sidebar-master.sidebar--collapsed {
      width: 68px;
    }

    /* -------------------------------------------------------- */
    /* Encabezado del Menú Lateral                              */
    /* -------------------------------------------------------- */
    .sidebar-header {
      height: 54px;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: #090d16;
    }

    .brand-mini {
      display: flex;
      flex-direction: column;
    }

    .brand-tag {
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #06b6d4;
    }

    .brand-title {
      font-size: 0.84rem;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.01em;
    }

    .collapse-toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid rgba(6, 182, 212, 0.25);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .collapse-toggle-btn:hover {
      background: #0891b2;
      color: #ffffff;
      border-color: #06b6d4;
      box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
    }

    .toggle-arrow {
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* -------------------------------------------------------- */
    /* Buscador Rápido Interno                                  */
    /* -------------------------------------------------------- */
    .sidebar-search-box {
      padding: 0.75rem 0.85rem 0.4rem 0.85rem;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 10px;
      pointer-events: none;
    }

    .sidebar-search-input {
      width: 100%;
      height: 34px;
      padding: 0 1.8rem 0 2rem;
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #f8fafc;
      font-size: 0.76rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .sidebar-search-input:focus {
      border-color: #06b6d4;
      box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
      background: #0f172a;
    }

    .sidebar-search-input::placeholder {
      color: #64748b;
      font-size: 0.74rem;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.7rem;
      cursor: pointer;
      padding: 2px 4px;
    }

    .clear-search-btn:hover {
      color: #f1f5f9;
    }

    /* -------------------------------------------------------- */
    /* Contenido Navegable (Scroll Suave)                       */
    /* -------------------------------------------------------- */
    .sidebar-content {
      flex: 1;
      padding: 0.65rem 0.6rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .sidebar-content::-webkit-scrollbar {
      width: 4px;
    }

    .sidebar-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-content::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    .sidebar-content::-webkit-scrollbar-thumb:hover {
      background: #06b6d4;
    }

    /* -------------------------------------------------------- */
    /* Item Raíz (Panel Principal / Inicio)                     */
    /* -------------------------------------------------------- */
    .nav-root-item {
      width: 100%;
      height: 42px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: transparent;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      gap: 0.75rem;
      cursor: pointer;
      font-size: 0.825rem;
      font-weight: 600;
      transition: all 0.15s ease;
      position: relative;
    }

    .sidebar--collapsed .nav-root-item {
      justify-content: center;
      padding: 0;
    }

    .nav-root-item:hover {
      background: #1e293b;
      color: #f8fafc;
      border-color: rgba(6, 182, 212, 0.25);
    }

    .nav-root-item--active {
      background: rgba(6, 182, 212, 0.12) !important;
      color: #06b6d4 !important;
      border-color: rgba(6, 182, 212, 0.4) !important;
      font-weight: 700;
    }

    .item-icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-label {
      white-space: nowrap;
    }

    .active-glow-pip {
      position: absolute;
      right: 10px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
    }

    .section-divider {
      padding: 0.75rem 0.5rem 0.25rem 0.5rem;
      font-size: 0.62rem;
      font-weight: 800;
      color: #475569;
      letter-spacing: 0.08em;
    }

    /* -------------------------------------------------------- */
    /* Módulos Agrupados y Acordeones                           */
    /* -------------------------------------------------------- */
    .module-group {
      display: flex;
      flex-direction: column;
      border-radius: 9px;
      overflow: hidden;
      margin-bottom: 0.25rem;
    }

    .group-header-btn {
      width: 100%;
      height: 42px;
      border-radius: 9px;
      border: 1px solid transparent;
      background: transparent;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.75rem;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }

    .sidebar--collapsed .group-header-btn {
      justify-content: center;
      padding: 0;
    }

    .group-header-btn:hover {
      background: #1e293b;
      color: #ffffff;
    }

    .group-header-btn--active {
      color: #06b6d4;
      background: rgba(15, 23, 42, 0.6);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .group-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #06b6d4;
      flex-shrink: 0;
    }

    .group-title {
      white-space: nowrap;
      font-size: 0.79rem;
    }

    .chevron-indicator {
      color: #64748b;
      transition: transform 0.2s ease;
    }

    .chevron--expanded {
      transform: rotate(180deg);
      color: #06b6d4;
    }

    /* Sub-estaciones desplegables */
    .group-children {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.35rem 0.4rem 0.5rem 1.6rem;
      background: rgba(9, 13, 22, 0.5);
      border-left: 2px solid rgba(6, 182, 212, 0.3);
      margin-left: 1.15rem;
      margin-top: 0.2rem;
      margin-bottom: 0.35rem;
      border-radius: 0 8px 8px 0;
    }

    .substation-block {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .substation-title-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.15rem 0;
    }

    .substation-bullet {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #0891b2;
      flex-shrink: 0;
    }

    .substation-name {
      font-size: 0.73rem;
      font-weight: 700;
      color: #cbd5e1;
      letter-spacing: -0.01em;
    }

    /* -------------------------------------------------------- */
    /* Botones Interactivos de Acción: Llenar vs Ver Registros  */
    /* -------------------------------------------------------- */
    .action-buttons-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      margin-left: 0.6rem;
    }

    .action-subitem-btn,
    .action-direct-btn {
      height: 28px;
      padding: 0 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: #1e293b;
      color: #94a3b8;
      font-size: 0.68rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .action-subitem-btn:hover,
    .action-direct-btn:hover {
      background: #334155;
      color: #ffffff;
      border-color: rgba(6, 182, 212, 0.4);
    }

    .action-subitem--active {
      background: #0891b2 !important;
      color: #ffffff !important;
      border-color: #06b6d4 !important;
      box-shadow: 0 0 8px rgba(6, 182, 212, 0.35);
      font-weight: 700;
    }

    .action-direct-box {
      margin-left: 0.6rem;
    }

    .action-direct-btn {
      width: 100%;
      justify-content: flex-start;
      padding: 0 0.65rem;
    }

    /* -------------------------------------------------------- */
    /* Pie del Menú Lateral                                     */
    /* -------------------------------------------------------- */
    .sidebar-footer {
      padding: 0.75rem 1rem;
      background: #090d16;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .gmp-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 6px #06b6d4;
    }

    .footer-text {
      font-size: 0.62rem;
      font-weight: 800;
      color: #06b6d4;
      letter-spacing: 0.05em;
    }

    .version-label {
      font-size: 0.62rem;
      color: #475569;
      font-weight: 600;
    }
  `],
})
export class SidebarComponent {
  ui = inject(UiStateService);
  auth = inject(AuthService);
  private router = inject(Router);

  searchFilter = '';

  // Acordeones abiertos (inician expandidos los principales para mejor ergonomía)
  openGroups = signal<Record<string, boolean>>({
    'materias-primas': true,
    'produccion': true,
    'control-calidad': false,
    'trazabilidad': false,
    'catalogos': false,
  });

  // Definición de módulos de trazabilidad (BioTrace Dermo-Pharma)
  readonly moduleGroups: ModuleGroup[] = [
    {
      key: 'materias-primas',
      title: 'Materias Primas & Insumos',
      iconSvg: `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      `,
      subStations: [
        { key: 'mp-ingreso', label: 'Ingreso de Lotes Insumos' },
        { key: 'mp-consumo', label: 'Consumos en Reactores' },
        { key: 'mp-inventario', label: 'Stock & Lotes Activos', hasTabs: false },
      ],
    },
    {
      key: 'produccion',
      title: 'Manufactura & Formulación',
      iconSvg: `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      `,
      subStations: [
        { key: 'produccion-ordenes', label: 'Órdenes de Producción' },
        { key: 'produccion-lotes', label: 'Lotes Producto Terminado' },
      ],
    },
    {
      key: 'control-calidad',
      title: 'Control de Calidad (GMP)',
      iconSvg: `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 2v7.31"></path>
          <path d="M14 9.3V1.99"></path>
          <path d="M8.5 2h7"></path>
          <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
          <path d="M5.52 16h12.96"></path>
        </svg>
      `,
      subStations: [
        { key: 'calidad-liberacion', label: 'Liberación de Lotes', hasTabs: false },
      ],
    },
    {
      key: 'trazabilidad',
      title: 'Trazabilidad 360°',
      iconSvg: `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="6" y1="3" x2="6" y2="15"></line>
          <circle cx="18" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M18 9a9 9 0 0 1-9 9"></path>
        </svg>
      `,
      subStations: [
        { key: 'trazabilidad-backward', label: 'Trazabilidad Ascendente', hasTabs: false },
        { key: 'trazabilidad-forward', label: 'Trazabilidad Descendente', hasTabs: false },
      ],
    },
    {
      key: 'catalogos',
      title: 'Catálogos & Homologación',
      iconSvg: `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      `,
      subStations: [
        { key: 'cat-proveedores', label: 'Laboratorios & Proveedores' },
        { key: 'cat-materiales', label: 'Principios Activos & Excipientes' },
        { key: 'cat-productos', label: 'Fórmulas & Productos' },
      ],
    },
  ];

  filteredGroups = computed(() => {
    const q = this.searchFilter.toLowerCase().trim();
    if (!q) return this.moduleGroups;

    return this.moduleGroups
      .map((group) => {
        const matchesGroup = group.title.toLowerCase().includes(q);
        const matchedSubs = group.subStations.filter((s) => s.label.toLowerCase().includes(q));
        if (matchesGroup || matchedSubs.length > 0) {
          return {
            ...group,
            subStations: matchesGroup ? group.subStations : matchedSubs,
          };
        }
        return null;
      })
      .filter((g): g is ModuleGroup => g !== null);
  });

  isGroupOpen(groupKey: string): boolean {
    return !!this.openGroups()[groupKey];
  }

  isGroupActive(groupKey: string): boolean {
    const group = this.moduleGroups.find((g) => g.key === groupKey);
    if (!group) return false;
    return group.subStations.some((s) => s.key === this.ui.activeModule());
  }

  toggleGroup(groupKey: string) {
    if (!this.ui.sidebarExpanded()) {
      this.ui.setSidebar(true);
    }
    this.openGroups.update((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  }

  selectModule(moduleKey: string) {
    this.ui.navigateTo(moduleKey, 'list');
    this.router.navigate(['/home']);
  }

  selectSubStation(subStationKey: string, tab: SubViewTab) {
    this.ui.navigateTo(subStationKey, tab);
    this.router.navigate(['/home']);
  }
}
