import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UiStateService, SubViewTab } from '../../core/services/ui-state.service';

interface StationMetadata {
  title: string;
  category: string;
  description: string;
  code: string;
  hasTabs: boolean;
}

const STATIONS_INFO: Record<string, StationMetadata> = {
  'mp-ingreso': {
    title: 'Ingreso de Lotes de Materias Primas',
    category: 'Materias Primas & Insumos',
    description: 'Recepción técnica y homologación de insumos con número de lote interno, peso neto recibido y certificado de análisis.',
    code: 'EST-MP-01',
    hasTabs: true,
  },
  'mp-consumo': {
    title: 'Consumo y Pesada en Reactores',
    category: 'Materias Primas & Insumos',
    description: 'Pesada analítica y dosificación de insumos en órdenes de mezcla con balance atómico de inventario.',
    code: 'EST-MP-02',
    hasTabs: true,
  },
  'mp-inventario': {
    title: 'Inventario & Stock de Principios Activos',
    category: 'Materias Primas & Insumos',
    description: 'Saldos actuales, control de cuarentena por lote, fechas de reanálisis y disponibilidad inmediata.',
    code: 'EST-MP-03',
    hasTabs: false,
  },
  'produccion-ordenes': {
    title: 'Órdenes de Formulación & Mezcla',
    category: 'Manufactura & Formulación',
    description: 'Programación de reactores con balance estricto de consumos sin desviaciones ni mermas no autorizadas.',
    code: 'EST-PR-01',
    hasTabs: true,
  },
  'produccion-lotes': {
    title: 'Lotes de Producto Terminado',
    category: 'Manufactura & Formulación',
    description: 'Identificación de lotes de producto final, número de unidades envasadas y pase a control de calidad.',
    code: 'EST-PR-02',
    hasTabs: true,
  },
  'calidad-liberacion': {
    title: 'Liberación de Control de Calidad (GMP/BPM)',
    category: 'Control de Calidad',
    description: 'Dictamen oficial de calidad bajo Buenas Prácticas de Manufactura: estados PENDING, APPROVED y REJECTED.',
    code: 'EST-QC-01',
    hasTabs: false,
  },
  'trazabilidad-backward': {
    title: 'Trazabilidad Ascendente (Backward 360°)',
    category: 'Trazabilidad 360°',
    description: 'Dado un lote de producto terminado, inspecciona cada consumo, lote de materia prima y proveedor de origen.',
    code: 'EST-TR-01',
    hasTabs: false,
  },
  'trazabilidad-forward': {
    title: 'Trazabilidad Descendente (Forward 360°)',
    category: 'Trazabilidad 360°',
    description: 'Dado un lote de principio activo, rastrea todas las órdenes de mezcla y lotes donde fue dispersado.',
    code: 'EST-TR-02',
    hasTabs: false,
  },
  'cat-proveedores': {
    title: 'Laboratorios & Proveedores Homologados',
    category: 'Catálogos & Homologación',
    description: 'Registro de proveedores aprobados para principios activos, casas fabricantes y gestión de contactos.',
    code: 'EST-CAT-01',
    hasTabs: true,
  },
  'cat-materiales': {
    title: 'Principios Activos & Excipientes',
    category: 'Catálogos & Homologación',
    description: 'Catálogo de materias primas con concentraciones, unidades estándar y especificaciones galénicas.',
    code: 'EST-CAT-02',
    hasTabs: true,
  },
  'cat-productos': {
    title: 'Catálogo de Fórmulas & Productos',
    category: 'Catálogos & Homologación',
    description: 'Fórmulas maestras de dermocosmética y fármacos aprobadas para manufactura.',
    code: 'EST-CAT-03',
    hasTabs: true,
  },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      
      <!-- ======================================================== -->
      <!-- CASO 1: VISTA DE ESTACIÓN SELECCIONADA DESDE EL SIDEBAR  -->
      <!-- ======================================================== -->
      <section *ngIf="currentStation() as station" class="station-view-wrapper">
        
        <!-- Encabezado de la Estación con Breadcrumb -->
        <header class="station-header">
          <div class="station-breadcrumb">
            <button class="back-link-btn" (click)="goToDashboard()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Panel Principal</span>
            </button>
            <span class="bc-separator">/</span>
            <span class="bc-category">{{ station.category }}</span>
            <span class="bc-separator">/</span>
            <span class="bc-current">{{ station.title }}</span>
          </div>

          <div class="station-title-row">
            <div>
              <div class="station-tag-row">
                <span class="station-code-badge">{{ station.code }}</span>
                <span class="station-domain-badge">Dermo-Pharma GMP</span>
              </div>
              <h1 class="station-title">{{ station.title }}</h1>
              <p class="station-desc">{{ station.description }}</p>
            </div>

            <!-- Botones Interactivos de Pestañas (Llenar formato vs Ver registros) -->
            <div class="station-tab-pills" *ngIf="station.hasTabs">
              <button
                type="button"
                class="tab-pill"
                [class.tab-pill--active]="ui.activeTab() === 'form'"
                (click)="setTab('form')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>Llenar formato</span>
              </button>

              <button
                type="button"
                class="tab-pill"
                [class.tab-pill--active]="ui.activeTab() === 'list'"
                (click)="setTab('list')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Ver registros</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Tarjeta de Contenido de la Estación -->
        <div class="card station-content-card">
          <div class="content-view-header">
            <div class="view-indicator">
              <span class="view-dot"></span>
              <strong>{{ ui.activeTab() === 'form' ? 'Modo de Registro: Formulario Activo' : 'Modo de Consulta: Historial & Registros' }}</strong>
            </div>
            <span class="station-badge-sub">{{ station.code }} • {{ ui.activeTab() === 'form' ? 'NUEVO' : 'CONSULTA' }}</span>
          </div>

          <!-- Pestaña Formulario -->
          <div *ngIf="ui.activeTab() === 'form' && station.hasTabs" class="form-placeholder-box">
            <div class="placeholder-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3>Formato de Registro Técnico para {{ station.title }}</h3>
            <p>
              Estación lista para capturar datos con validación Zod en backend, control estricto de unidades y persistencia atómica en Neon PostgreSQL.
            </p>
            <div class="placeholder-actions">
              <button class="btn btn-primary" (click)="setTab('list')">
                <span>Ver registros actuales</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <!-- Pestaña Lista / Registros -->
          <div *ngIf="ui.activeTab() === 'list' || !station.hasTabs" class="list-placeholder-box">
            <div class="table-top-bar">
              <div class="table-search-pill">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" placeholder="Filtrar por lote, código o fecha..." class="table-filter-input" />
              </div>

              <div class="table-actions">
                <button *ngIf="station.hasTabs" class="btn btn-primary" (click)="setTab('form')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Nuevo Registro</span>
                </button>
              </div>
            </div>

            <!-- Tabla de Registros Estilizada en Titanio & Cian -->
            <div class="records-table-container">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>CÓDIGO / IDENTIFICADOR</th>
                    <th>DETALLE TÉCNICO</th>
                    <th>ESTADO / FECHA</th>
                    <th>NORMATIVA</th>
                    <th style="text-align: right;">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span class="lote-tag">{{ station.code }}-2026-001</span>
                    </td>
                    <td>
                      <strong>{{ station.title }} (Registro Piloto)</strong>
                      <span class="sub-cell">Sincronizado con Neon PostgreSQL</span>
                    </td>
                    <td>
                      <span class="status-pill-qc">Activo / Operativo</span>
                    </td>
                    <td>
                      <span class="gmp-badge">GMP / BPM</span>
                    </td>
                    <td style="text-align: right;">
                      <button class="action-icon-btn" title="Ver detalle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </section>

      <!-- ======================================================== -->
      <!-- CASO 2: PANEL DE CONTROL PRINCIPAL (INICIO)              -->
      <!-- ======================================================== -->
      <section *ngIf="!currentStation()">
        
        <!-- Hero de Bienvenida -->
        <header class="hero-section">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            <span>Especializado en Dermocosmética & Farmacéutica</span>
          </div>
          <h1 class="hero-heading">Trazabilidad de Precisión para Fórmulas & Lotes</h1>
          <p class="hero-subtext">
            Control integral de principios activos, excipientes, formulación magistral y liberación de lotes bajo normativa de Buenas Prácticas de Manufactura (GMP/BPM).
          </p>
        </header>

        <!-- Panel de Control y Estado Operativo -->
        <div class="card status-card">
          <div class="status-grid">
            <div class="metric-item">
              <span class="metric-label">INFRAESTRUCTURA DE DATOS</span>
              <div class="metric-status">
                <span class="status-indicator-dot" [class.online]="isOnline()"></span>
                <strong>{{ isOnline() ? 'Neon PostgreSQL Conectado' : 'Conectando...' }}</strong>
              </div>
            </div>

            <div class="metric-item">
              <span class="metric-label">ESTÁNDAR OPERATIVO</span>
              <span class="metric-value">Normativa GMP / BPM Cosmética</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">SISTEMA VISUAL & NAVEGACIÓN</span>
              <span class="metric-value">Menú Lateral Maestro + CSS Grid</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">SESIÓN ACTIVA (JWT)</span>
              <div class="metric-status">
                <span class="status-indicator-dot online"></span>
                <strong>Expira en {{ auth.timeRemainingFormatted() }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Módulos del Sistema -->
        <section class="modules-section">
          <div class="section-header">
            <div>
              <h2 class="section-title">Módulos de Trazabilidad</h2>
              <p class="section-subtitle">Selecciona una estación en el menú lateral o accede directamente aquí</p>
            </div>
          </div>

          <div class="modules-grid">
            
            <!-- Módulo 1 -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">INSUMOS & QUÍMICA</span>
                <span class="module-code">MOD-01</span>
              </div>
              <h3>Principios Activos & Excipientes</h3>
              <p>Recepción de lotes de insumos con número de lote interno, tara, peso neto recibido y certificado de análisis de laboratorio de origen.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('mp-ingreso', 'list')">
                  <span>Ir a Ingreso de Lotes →</span>
                </button>
              </div>
            </div>

            <!-- Módulo 2 -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">HOMOLOGACIÓN</span>
                <span class="module-code">MOD-02</span>
              </div>
              <h3>Laboratorios & Proveedores</h3>
              <p>Directorio de proveedores calificados de materias primas, certificados de análisis y trazabilidad por casa fabricante autorizada.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('cat-proveedores', 'list')">
                  <span>Ir a Proveedores →</span>
                </button>
              </div>
            </div>

            <!-- Módulo 3 -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">MANUFACTURA</span>
                <span class="module-code">MOD-03</span>
              </div>
              <h3>Órdenes de Formulación & Mezcla</h3>
              <p>Programación de reactores con balance atómico de consumos: la suma de insumos pesados se valida contra el stock en tiempo real.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('produccion-ordenes', 'list')">
                  <span>Ir a Órdenes →</span>
                </button>
              </div>
            </div>

            <!-- Módulo 4 -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">ASEGURAMIENTO</span>
                <span class="module-code">MOD-04</span>
              </div>
              <h3>Lotes Terminados & Calidad</h3>
              <p>Lotes de producto cosmético y farmacéutico final, control de cuarentena y liberación oficial de calidad (APPROVED / REJECTED).</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('calidad-liberacion', 'list')">
                  <span>Ir a Calidad →</span>
                </button>
              </div>
            </div>

            <!-- Módulo 5 (Estrella) -->
            <div class="card module-box highlight-box">
              <div class="module-top">
                <span class="module-tag tag-cyan">AUDITORÍA TOTAL</span>
                <span class="module-code code-cyan">MOD-360°</span>
              </div>
              <h3>Trazabilidad 360° Bidireccional</h3>
              <p>Rastreo genealógico instantáneo: dado un producto terminado inspecciona cada lote de materia prima; o dado un insumo rastrea todos sus destinos.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('trazabilidad-backward', 'list')">
                  <span>Abrir Trazabilidad 360° →</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </section>

    </div>
  `,
  styles: [`
    /* ======================================================== */
    /* VISTA DE ESTACIÓN ACTIVA                                 */
    /* ======================================================== */
    .station-view-wrapper {
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .station-header {
      margin-bottom: 1.75rem;
    }

    .station-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.78rem;
      margin-bottom: 0.85rem;
      color: #64748b;
    }

    .back-link-btn {
      background: none;
      border: none;
      color: #0891b2;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0;
      font-size: 0.78rem;
    }

    .back-link-btn:hover {
      text-decoration: underline;
    }

    .bc-separator {
      color: #cbd5e1;
    }

    .bc-category {
      color: #475569;
      font-weight: 600;
    }

    .bc-current {
      color: #0f172a;
      font-weight: 700;
    }

    .station-title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .station-tag-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.45rem;
    }

    .station-code-badge {
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 800;
      color: #0891b2;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.3);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .station-domain-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .station-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin-bottom: 0.35rem;
    }

    .station-desc {
      font-size: 0.92rem;
      color: #475569;
      max-width: 680px;
    }

    /* Pestañas Interactivas (Llenar formato vs Ver registros) */
    .station-tab-pills {
      display: inline-flex;
      background: #e2e8f0;
      padding: 3px;
      border-radius: 10px;
      gap: 3px;
    }

    .tab-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.95rem;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-pill:hover {
      color: #0f172a;
    }

    .tab-pill--active {
      background: #0f172a;
      color: #ffffff !important;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    }

    .station-content-card {
      padding: 1.75rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }

    .content-view-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 1.5rem;
    }

    .view-indicator {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.85rem;
      color: #0f172a;
    }

    .view-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
    }

    .station-badge-sub {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.04em;
    }

    /* Caja de Marcador de Posición para Formulario */
    .form-placeholder-box {
      text-align: center;
      padding: 3rem 1.5rem;
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
    }

    .placeholder-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #ecfeff;
      border: 1px solid rgba(6, 182, 212, 0.3);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .form-placeholder-box h3 {
      font-size: 1.25rem;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }

    .form-placeholder-box p {
      color: #64748b;
      font-size: 0.88rem;
      max-width: 540px;
      margin: 0 auto 1.5rem auto;
      line-height: 1.5;
    }

    .placeholder-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    /* Barra Superior de la Tabla */
    .table-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }

    .table-search-pill {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.45rem 0.85rem;
      border-radius: 9px;
      width: 320px;
    }

    .table-filter-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.825rem;
      color: #0f172a;
      width: 100%;
    }

    /* Tabla de Registros */
    .records-table-container {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .records-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.84rem;
    }

    .records-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .records-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }

    .lote-tag {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.78rem;
      color: #0891b2;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.25);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .sub-cell {
      display: block;
      font-size: 0.74rem;
      color: #64748b;
      margin-top: 0.15rem;
    }

    .status-pill-qc {
      font-size: 0.72rem;
      font-weight: 700;
      color: #0891b2;
      background: #ecfeff;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
    }

    .gmp-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: #334155;
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .action-icon-btn {
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-icon-btn:hover {
      background: #ecfeff;
      border-color: #06b6d4;
      color: #0891b2;
    }

    /* ======================================================== */
    /* VISTA DE DASHBOARD PRINCIPAL                             */
    /* ======================================================== */
    .hero-section {
      margin-bottom: 2.5rem;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ecfeff;
      color: #0891b2;
      border: 1px solid rgba(8, 145, 178, 0.25);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin-bottom: 1.15rem;
    }
    .badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #06b6d4;
    }
    .hero-heading {
      font-size: 2.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 0.85rem;
      max-width: 880px;
    }
    .hero-subtext {
      font-size: 1.05rem;
      color: #475569;
      max-width: 760px;
      line-height: 1.6;
    }
    .status-card {
      margin-bottom: 3.5rem;
      border-left: 4px solid #06b6d4;
      padding: 1.65rem 2rem;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .metric-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .metric-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
    }
    .metric-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .status-indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
    }
    .status-indicator-dot.online {
      background: #06b6d4;
      box-shadow: 0 0 8px #06b6d4;
    }
    .modules-section {
      margin-top: 1rem;
    }
    .section-header {
      margin-bottom: 1.75rem;
    }
    .section-title {
      font-size: 1.55rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    .section-subtitle {
      font-size: 0.875rem;
      color: #64748b;
    }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .module-box {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .module-box:hover {
      border-color: #cbd5e1;
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }
    .module-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .module-tag {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.07em;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
    }
    .module-code {
      font-family: monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .module-box h3 {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    .module-box p {
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.6;
      flex: 1;
      margin-bottom: 1.5rem;
    }
    .module-foot {
      padding-top: 0.85rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.78rem;
    }
    .module-link-btn {
      background: none;
      border: none;
      color: #0891b2;
      font-weight: 700;
      font-size: 0.825rem;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .module-link-btn:hover {
      color: #06b6d4;
      transform: translateX(2px);
    }
    .highlight-box {
      background: linear-gradient(180deg, #ffffff 0%, #f0fdff 100%);
      border-color: rgba(8, 145, 178, 0.35);
      box-shadow: 0 4px 16px rgba(8, 145, 178, 0.06);
    }
    .tag-cyan {
      background: #ecfeff;
      color: #0891b2;
    }
    .code-cyan {
      color: #0891b2;
      font-weight: 700;
    }
  `],
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  ui = inject(UiStateService);
  isOnline = signal<boolean>(false);

  currentStation = computed<StationMetadata | null>(() => {
    const mod = this.ui.activeModule();
    if (mod === 'inicio') return null;
    return STATIONS_INFO[mod] || null;
  });

  ngOnInit() {
    this.api.getHealth().subscribe({
      next: (res) => this.isOnline.set(res.status === 'ok'),
      error: () => this.isOnline.set(false),
    });
  }

  setTab(tab: SubViewTab) {
    this.ui.activeTab.set(tab);
  }

  goToDashboard() {
    this.ui.navigateTo('inicio');
  }

  openModule(moduleKey: string, tab: SubViewTab = 'list') {
    this.ui.navigateTo(moduleKey, tab);
  }
}
