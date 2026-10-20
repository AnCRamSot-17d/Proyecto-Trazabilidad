import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UiStateService, SubViewTab } from '../../core/services/ui-state.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside
      class="lap-portal-sidebar"
      [class.lap-portal-sidebar--open]="ui.sidebarExpanded()"
      [class.lap-portal-sidebar--closed]="!ui.sidebarExpanded()"
      *ngIf="auth.isAuthenticated()"
    >
      <div class="lap-portal-sidebar__content">
        
        <!-- ============================================== -->
        <!-- 1. BOTÓN SUPERIOR: PANEL PRINCIPAL (INICIO)   -->
        <!-- ============================================== -->
        <div class="lap-portal-sidebar__nav">
          <button
            type="button"
            (click)="selectModule('inicio')"
            class="lap-sidebar-nav-item"
            [class.lap-sidebar-nav-item--active]="ui.activeModule() === 'inicio'"
            title="Inicio"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span *ngIf="ui.sidebarExpanded()">Panel Principal</span>
          </button>
        </div>

        <!-- ============================================== -->
        <!-- MODO EXPANDIDO: ÁRBOL DE MENÚS Y ACORDEONES   -->
        <!-- ============================================== -->
        <div *ngIf="ui.sidebarExpanded()" class="lap-sidebar-nav">
          
          <!-- SECCIÓN: ESTACIONES -->
          <span class="lap-sidebar-section-title">Estaciones</span>

          <!-- GRAN MENÚ 1: ESTACIONES / PRODUCCIÓN -->
          <div class="lap-sidebar-station-group lap-sidebar-master-group">
            <button
              type="button"
              (click)="toggleEstaciones()"
              class="lap-sidebar-station-header lap-sidebar-master-header"
              [class.lap-sidebar-master-header--open]="openEstaciones()"
              title="Estaciones de Producción"
            >
              <div class="lap-sidebar-station-header__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
                  <path d="M17 18h1"></path>
                  <path d="M12 18h1"></path>
                  <path d="M7 18h1"></path>
                </svg>
                <span class="lap-sidebar-master-header__text">ESTACIONES</span>
              </div>
              <svg *ngIf="openEstaciones()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <svg *ngIf="!openEstaciones()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- CONTENEDOR ANIDADO DE ESTACIONES -->
            <div class="lap-sidebar-nested-container" *ngIf="openEstaciones()">
              
              <!-- SUBMENÚ: MATERIAS PRIMAS -->
              <div class="lap-sidebar-station-group">
                <button
                  type="button"
                  (click)="toggleSubmenu('materias-primas')"
                  class="lap-sidebar-station-header lap-sidebar-subgroup-header"
                  [class.lap-sidebar-subgroup-header--active]="openSubmenus()['materias-primas']"
                  title="Materias Primas"
                >
                  <div class="lap-sidebar-station-header__left">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    <span>Materias Primas</span>
                  </div>
                  <svg *ngIf="openSubmenus()['materias-primas']" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <svg *ngIf="!openSubmenus()['materias-primas']" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <!-- SUB-ESTACIONES ANIDADAS DE MATERIAS PRIMAS -->
                <div class="lap-sidebar-submenu lap-sidebar-nested-substations" *ngIf="openSubmenus()['materias-primas']">
                  
                  <!-- 1. INGRESO DE MATERIAS PRIMAS -->
                  <div class="lap-sidebar-station-group">
                    <button
                      type="button"
                      (click)="toggleInnerSection('mp-ingreso')"
                      class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                      [class.lap-sidebar-station-header--active]="ui.activeModule() === 'mp-ingreso'"
                      title="Ingreso de Materias Primas"
                    >
                      <div class="lap-sidebar-station-header__left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M16 16h6"></path>
                          <path d="M19 13v6"></path>
                          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                          <polyline points="3.29 7 12 12 20.71 7"></polyline>
                          <line x1="12" y1="22" x2="12" y2="12"></line>
                        </svg>
                        <span>Ingreso</span>
                      </div>
                      <svg *ngIf="openInnerSections()['mp-ingreso']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      <svg *ngIf="!openInnerSections()['mp-ingreso']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>

                    <!-- Pestañas Ingreso: Llenar formato & Ver registros -->
                    <div class="lap-sidebar-submenu lap-sidebar-submenu--sub" *ngIf="openInnerSections()['mp-ingreso']">
                      <button
                        type="button"
                        (click)="selectSubStation('mp-ingreso', 'form')"
                        class="lap-sidebar-subitem"
                        [class.lap-sidebar-subitem--active]="ui.activeModule() === 'mp-ingreso' && ui.activeTab() === 'form'"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <span>Llenar formato</span>
                      </button>

                      <button
                        type="button"
                        (click)="selectSubStation('mp-ingreso', 'list')"
                        class="lap-sidebar-subitem"
                        [class.lap-sidebar-subitem--active]="ui.activeModule() === 'mp-ingreso' && ui.activeTab() === 'list'"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Ver registros</span>
                      </button>
                    </div>
                  </div>

                  <!-- 2. CONSUMO DE MATERIAS PRIMAS -->
                  <div class="lap-sidebar-station-group">
                    <button
                      type="button"
                      (click)="toggleInnerSection('mp-consumo')"
                      class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                      [class.lap-sidebar-station-header--active]="ui.activeModule() === 'mp-consumo'"
                      title="Consumo de Materias Primas"
                    >
                      <div class="lap-sidebar-station-header__left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M16 16h6"></path>
                          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"></path>
                          <polyline points="3.29 7 12 12 20.71 7"></polyline>
                          <line x1="12" y1="22" x2="12" y2="12"></line>
                        </svg>
                        <span>Consumo</span>
                      </div>
                      <svg *ngIf="openInnerSections()['mp-consumo']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                      <svg *ngIf="!openInnerSections()['mp-consumo']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>

                    <!-- Pestañas Consumo: Llenar formato & Ver registros -->
                    <div class="lap-sidebar-submenu lap-sidebar-submenu--sub" *ngIf="openInnerSections()['mp-consumo']">
                      <button
                        type="button"
                        (click)="selectSubStation('mp-consumo', 'form')"
                        class="lap-sidebar-subitem"
                        [class.lap-sidebar-subitem--active]="ui.activeModule() === 'mp-consumo' && ui.activeTab() === 'form'"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <span>Llenar formato</span>
                      </button>

                      <button
                        type="button"
                        (click)="selectSubStation('mp-consumo', 'list')"
                        class="lap-sidebar-subitem"
                        [class.lap-sidebar-subitem--active]="ui.activeModule() === 'mp-consumo' && ui.activeTab() === 'list'"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span>Ver registros</span>
                      </button>
                    </div>
                  </div>

                  <!-- 3. INVENTARIO Y STOCK -->
                  <div class="lap-sidebar-station-group">
                    <button
                      type="button"
                      (click)="selectSubStation('mp-inventario', 'list')"
                      class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                      [class.lap-sidebar-station-header--active]="ui.activeModule() === 'mp-inventario'"
                      title="Inventario y Stock de Materias Primas"
                    >
                      <div class="lap-sidebar-station-header__left">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                          <polyline points="2 17 12 22 22 17"></polyline>
                          <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                        <span>Inventario y Stock</span>
                      </div>
                    </button>
                  </div>

                </div>
              </div>

            </div>
          </div>

          <!-- SECCIÓN: GESTIÓN COMERCIAL / VENTAS -->
          <span class="lap-sidebar-section-title" style="margin-top: 8px;">Comercial</span>

          <!-- GRAN MENÚ 2: PEDIDOS / VENTAS / PRODUCTOS -->
          <div class="lap-sidebar-station-group lap-sidebar-master-group">
            <button
              type="button"
              (click)="toggleVentas()"
              class="lap-sidebar-station-header lap-sidebar-master-header"
              [class.lap-sidebar-master-header--open]="openVentas()"
              title="Ventas, Clientes y Pedidos"
            >
              <div class="lap-sidebar-station-header__left">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="8" cy="21" r="1"></circle>
                  <circle cx="19" cy="21" r="1"></circle>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                </svg>
                <span class="lap-sidebar-master-header__text">PEDIDOS / VENTAS / PRODUCTOS</span>
              </div>
              <svg *ngIf="openVentas()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <svg *ngIf="!openVentas()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            <!-- CONTENEDOR ANIDADO DE VENTAS / CLIENTES / PRODUCTOS -->
            <div class="lap-sidebar-nested-container" *ngIf="openVentas()">
              
              <!-- 1. SUBMENÚ: AGREGAR CLIENTES / CLIENTES -->
              <div class="lap-sidebar-station-group">
                <button
                  type="button"
                  (click)="toggleInnerSection('clientes')"
                  class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                  [class.lap-sidebar-station-header--active]="ui.activeModule() === 'clientes'"
                  title="Gestión de Clientes"
                >
                  <div class="lap-sidebar-station-header__left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <span>Agregar Cliente</span>
                  </div>
                  <svg *ngIf="openInnerSections()['clientes']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <svg *ngIf="!openInnerSections()['clientes']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <!-- Pestañas Clientes: Llenar formato & Ver registros -->
                <div class="lap-sidebar-submenu lap-sidebar-submenu--sub" *ngIf="openInnerSections()['clientes']">
                  <button
                    type="button"
                    (click)="selectSubStation('clientes', 'form')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'clientes' && ui.activeTab() === 'form'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span>Llenar formato</span>
                  </button>

                  <button
                    type="button"
                    (click)="selectSubStation('clientes', 'list')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'clientes' && ui.activeTab() === 'list'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Ver registros</span>
                  </button>
                </div>
              </div>

              <!-- 2. SUBMENÚ: AGREGAR PRODUCTOS / PRODUCTOS -->
              <div class="lap-sidebar-station-group">
                <button
                  type="button"
                  (click)="toggleInnerSection('productos')"
                  class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                  [class.lap-sidebar-station-header--active]="ui.activeModule() === 'productos'"
                  title="Agregar Productos y Formulación"
                >
                  <div class="lap-sidebar-station-header__left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.29 7 12 12 20.71 7"></polyline>
                      <line x1="12" y1="22" x2="12" y2="12"></line>
                    </svg>
                    <span>Agregar productos</span>
                  </div>
                  <svg *ngIf="openInnerSections()['productos']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <svg *ngIf="!openInnerSections()['productos']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <!-- Pestañas Productos: Llenar formato & Ver registros -->
                <div class="lap-sidebar-submenu lap-sidebar-submenu--sub" *ngIf="openInnerSections()['productos']">
                  <button
                    type="button"
                    (click)="selectSubStation('productos', 'form')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'productos' && ui.activeTab() === 'form'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span>Llenar formato</span>
                  </button>

                  <button
                    type="button"
                    (click)="selectSubStation('productos', 'list')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'productos' && ui.activeTab() === 'list'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Ver registros</span>
                  </button>
                </div>
              </div>

              <!-- 3. SUBMENÚ: ORDEN PEDIDO / PEDIDOS -->
              <div class="lap-sidebar-station-group">
                <button
                  type="button"
                  (click)="toggleInnerSection('pedidos')"
                  class="lap-sidebar-station-header lap-sidebar-station-header--sub"
                  [class.lap-sidebar-station-header--active]="ui.activeModule() === 'pedidos'"
                  title="Órdenes de Pedido de Clientes"
                >
                  <div class="lap-sidebar-station-header__left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                      <path d="M3 6h18"></path>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    <span>Orden pedido</span>
                  </div>
                  <svg *ngIf="openInnerSections()['pedidos']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  <svg *ngIf="!openInnerSections()['pedidos']" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>

                <!-- Pestañas Pedidos: Llenar formato & Ver registros -->
                <div class="lap-sidebar-submenu lap-sidebar-submenu--sub" *ngIf="openInnerSections()['pedidos']">
                  <button
                    type="button"
                    (click)="selectSubStation('pedidos', 'form')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'pedidos' && ui.activeTab() === 'form'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span>Llenar formato</span>
                  </button>

                  <button
                    type="button"
                    (click)="selectSubStation('pedidos', 'list')"
                    class="lap-sidebar-subitem"
                    [class.lap-sidebar-subitem--active]="ui.activeModule() === 'pedidos' && ui.activeTab() === 'list'"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>Ver registros</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- ============================================== -->
        <!-- MODO COMPACTO (MINI SLOTS COMO EN LAPROBELL)   -->
        <!-- ============================================== -->
        <div *ngIf="!ui.sidebarExpanded()" class="lap-portal-sidebar__mini-icons">
          <!-- Mini icono para Estaciones -->
          <div
            class="lap-portal-mini-slot"
            [class.lap-portal-mini-slot--active]="openEstaciones()"
            title="Estaciones de Producción"
            (click)="expandWithEstaciones()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path>
              <path d="M17 18h1"></path>
              <path d="M12 18h1"></path>
              <path d="M7 18h1"></path>
            </svg>
          </div>

          <!-- Mini icono para Ventas / Clientes / Pedidos -->
          <div
            class="lap-portal-mini-slot"
            [class.lap-portal-mini-slot--active]="openVentas()"
            title="Pedidos / Ventas / Productos"
            (click)="expandWithVentas()"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
            </svg>
          </div>
        </div>

      </div>
    </aside>
  `,
  styles: [`
    /* ==========================================================================
       SIDEBAR MAESTRO DE NAVEGACIÓN (INTEGRADO AL LAYOUT - ESTILO LAPROBELL)
       ========================================================================== */
    :host {
      display: block;
      flex-shrink: 0;
      height: 100%;
      z-index: 90;
    }

    .lap-portal-sidebar {
      height: 100%;
      background: #ffffff;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
      box-shadow: 1px 0 3px rgba(0, 0, 0, 0.02);
      overflow: hidden;
    }

    .lap-portal-sidebar--open {
      width: 275px;
    }

    .lap-portal-sidebar--closed {
      width: 64px;
    }

    .lap-portal-sidebar__content {
      flex: 1;
      padding: 0.75rem 0.65rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .lap-portal-sidebar__content::-webkit-scrollbar {
      width: 4px;
    }

    .lap-portal-sidebar__content::-webkit-scrollbar-track {
      background: transparent;
    }

    .lap-portal-sidebar__content::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 4px;
    }

    .lap-portal-sidebar__content::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }

    /* --------------------------------------------------------------------------
       BOTÓN INICIO (PANEL PRINCIPAL)
       -------------------------------------------------------------------------- */
    .lap-portal-sidebar__nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .lap-sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: #475569;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .lap-portal-sidebar--closed .lap-sidebar-nav-item {
      justify-content: center;
      padding: 10px 0;
    }

    .lap-sidebar-nav-item:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #e2e8f0;
    }

    .lap-sidebar-nav-item--active {
      background: #ecfeff !important;
      color: #0891b2 !important;
      border-color: rgba(6, 182, 212, 0.35) !important;
      font-weight: 700;
    }

    /* --------------------------------------------------------------------------
       TÍTULO DE SECCIONES Y ENCABEZADOS DE ACORDEÓN
       -------------------------------------------------------------------------- */
    .lap-sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .lap-sidebar-section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      padding: 6px 10px 2px 10px;
    }

    .lap-sidebar-station-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lap-sidebar-station-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 9px 12px;
      border-radius: 10px;
      border: 1px solid transparent;
      background: transparent;
      color: #334155;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .lap-sidebar-station-header:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .lap-sidebar-station-header__left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lap-sidebar-station-header__left svg {
      flex-shrink: 0;
      color: #0891b2;
    }

    /* ==========================================================================
       GRAN ACORDEÓN PRINCIPAL (ESTACIONES Y VENTAS)
       ========================================================================== */
    .lap-sidebar-master-group {
      margin-bottom: 4px;
    }

    .lap-sidebar-master-header {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 12px;
      transition: all 0.2s ease;
    }

    .lap-sidebar-master-header:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .lap-sidebar-master-header--open {
      background: #ecfeff;
      border-color: rgba(6, 182, 212, 0.35);
      color: #0891b2;
    }

    .lap-sidebar-master-header__text {
      font-weight: 800;
      letter-spacing: 0.04em;
      font-size: 12.5px;
    }

    .lap-sidebar-nested-container {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding-left: 8px;
      margin-left: 10px;
      margin-top: 4px;
      margin-bottom: 8px;
      border-left: 2px solid #e2e8f0;
    }

    /* Subgrupo de Materias Primas */
    .lap-sidebar-subgroup-header {
      font-size: 12.5px;
      padding: 7px 10px;
      color: #475569;
    }

    .lap-sidebar-subgroup-header:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .lap-sidebar-subgroup-header--active {
      color: #0891b2;
      font-weight: 700;
      background: #f0fdff;
    }

    .lap-sidebar-nested-substations {
      padding-left: 6px;
      margin-left: 8px;
      margin-top: 3px;
      margin-bottom: 4px;
      border-left: 1.5px dashed #cbd5e1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .lap-sidebar-station-header--sub {
      font-size: 12px;
      padding: 6px 8px;
      font-weight: 600;
      border-radius: 8px;
      white-space: nowrap;
      overflow: hidden;
    }

    .lap-sidebar-station-header--sub .lap-sidebar-station-header__left {
      gap: 6px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .lap-sidebar-station-header--sub span {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lap-sidebar-station-header--active {
      color: #0891b2;
      font-weight: 700;
      background: #ecfeff;
    }

    /* Sub-menú para Llenar formato y Ver registros */
    .lap-sidebar-submenu--sub {
      padding-left: 14px;
      margin-left: 8px;
      margin-top: 2px;
      margin-bottom: 4px;
      border-left: 1.5px solid #e2e8f0;
    }

    .lap-sidebar-subitem {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      width: 100%;
    }

    .lap-sidebar-subitem:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .lap-sidebar-subitem--active {
      background: #ecfeff;
      color: #0891b2;
      font-weight: 700;
      border-left: 2px solid #06b6d4;
    }

    .lap-sidebar-subitem svg {
      flex-shrink: 0;
    }

    /* --------------------------------------------------------------------------
       MINI SLOTS COMPACTOS (MODO PLEGADO COMO EN LAPROBELL)
       -------------------------------------------------------------------------- */
    .lap-portal-sidebar__mini-icons {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    .lap-portal-mini-slot {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #0891b2;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .lap-portal-mini-slot:hover {
      background: #ecfeff;
      border-color: rgba(6, 182, 212, 0.35);
      color: #06b6d4;
    }

    .lap-portal-mini-slot--active {
      background: #ecfeff;
      color: #0891b2;
      border: 1px solid rgba(6, 182, 212, 0.35);
    }
  `],
})
export class SidebarComponent {
  ui = inject(UiStateService);
  auth = inject(AuthService);
  private router = inject(Router);

  // Acordeón Principal 1: Estaciones
  openEstaciones = signal<boolean>(true);

  // Acordeón Principal 2: Ventas / Clientes / Pedidos
  openVentas = signal<boolean>(false);

  // Submenús de primer nivel (Materias Primas)
  openSubmenus = signal<Record<string, boolean>>({
    'materias-primas': true,
  });

  // Sub-secciones desplegables internas (Ingreso, Consumo, Clientes, Productos, Pedidos)
  openInnerSections = signal<Record<string, boolean>>({
    'mp-ingreso': true,
    'mp-consumo': false,
    'clientes': false,
    'productos': false,
    'pedidos': false,
  });

  toggleEstaciones() {
    this.openEstaciones.update((v) => !v);
  }

  toggleVentas() {
    this.openVentas.update((v) => !v);
  }

  toggleSubmenu(key: string) {
    this.openSubmenus.update((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  toggleInnerSection(key: string) {
    this.openInnerSections.update((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  expandWithEstaciones() {
    this.ui.setSidebar(true);
    this.openEstaciones.set(true);
    this.openVentas.set(false);
  }

  expandWithVentas() {
    this.ui.setSidebar(true);
    this.openVentas.set(true);
    this.openEstaciones.set(false);
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
