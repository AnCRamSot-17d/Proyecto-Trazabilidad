import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    description: 'Recepción técnica y homologación de insumos con número de lote interno, peso neto recibido y certificado de análisis (COA).',
    code: 'EST-MP-01',
    hasTabs: true,
  },
  'mp-consumo': {
    title: 'Consumo y Pesada en Reactores',
    category: 'Materias Primas & Insumos',
    description: 'Pesada analítica y dosificación de insumos en reactores con balance atómico de inventario.',
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
  'clientes': {
    title: 'Gestión de Clientes',
    category: 'Ventas / Clientes / Pedidos',
    description: 'Directorio y homologación de clientes comerciales, puntos de despacho y marcas autorizadas.',
    code: 'EST-CLI-01',
    hasTabs: true,
  },
  'productos': {
    title: 'Agregar Productos & Fórmulas',
    category: 'Ventas / Clientes / Pedidos',
    description: 'Catálogo de formulaciones galénicas, códigos únicos de producto y especificaciones de presentación.',
    code: 'EST-PROD-01',
    hasTabs: true,
  },
  'pedidos': {
    title: 'Órdenes de Pedido de Clientes',
    category: 'Ventas / Clientes / Pedidos',
    description: 'Registro de solicitudes de pedido, números de orden y asignación de despachos comerciales.',
    code: 'EST-PED-01',
    hasTabs: true,
  },
};

export interface IngresoMateriaPrimaItem {
  id: string;
  loteInterno: string;
  producto: string;
  codigoInsumo: string;
  fechaRecepcion: string;
  proveedor: string;
  loteProveedor: string;
  cantidadRecibida: number;
  unidades: string;
  precioPorUnidad: number;
  costoTotal: number;
  fechaFabricacion: string;
  fechaVencimiento: string;
  estadoCalidad: 'Aprobado' | 'Cuarentena' | 'Rechazado';
  aspecto: string;
  colorOlor: string;
  phDensidad: string;
  coaArchivo: string;
  liberadoPor: string;
  observaciones: string;
}

export interface ConsumoItem {
  id: string;
  ordenMezcla: string;
  reactor: string;
  materiaPrima: string;
  loteConsumido: string;
  cantidadDosificada: number;
  unidad: string;
  fechaConsumo: string;
  responsablePesada: string;
  estado: string;
}

export interface ClienteItem {
  id: string;
  razonSocial: string;
  nit: string;
  contacto: string;
  correo: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  categoria: string;
  estado: string;
}

export interface ProductoItem {
  id: string;
  codigoGalenico: string;
  nombreComercial: string;
  presentacion: string;
  phObjetivo: string;
  densidadObjetivo: string;
  vidaUtilMeses: number;
  registroSanitario: string;
  estado: string;
}

export interface PedidoItem {
  id: string;
  numeroPedido: string;
  cliente: string;
  producto: string;
  cantidadUnidades: number;
  fechaOrden: string;
  fechaEntregaEstimada: string;
  prioridad: string;
  estado: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      
      <!-- ======================================================== -->
      <!-- CASO 1: VISTA DE ESTACIÓN SELECCIONADA DESDE EL SIDEBAR  -->
      <!-- ======================================================== -->
      <section *ngIf="currentStation() as station" class="station-view-wrapper">
        
        <!-- ENCABEZADO DE ESTACIÓN MODERNO (SIN BREADCRUMBS) -->
        <header class="station-header">
          <div class="station-header-main">
            <!-- Icono de la Estación con diseño Titanio & Cian -->
            <div class="station-badge-icon">
              <svg *ngIf="station.code.startsWith('EST-MP')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <svg *ngIf="station.code.startsWith('EST-PR')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <svg *ngIf="station.code.startsWith('EST-CLI')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <svg *ngIf="station.code.startsWith('EST-PROD') || station.code.startsWith('EST-PED')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <svg *ngIf="station.code.startsWith('EST-QC') || station.code.startsWith('EST-TR')" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </div>

            <div class="station-header-text">
              <div class="station-tag-row">
                <span class="station-code-badge">{{ station.code }}</span>
                <span class="station-domain-badge">Dermo-Pharma GMP</span>
                <span class="station-cat-badge">{{ station.category }}</span>
              </div>
              <h1 class="station-title">{{ station.title }}</h1>
              <p class="station-desc">{{ station.description }}</p>
            </div>
          </div>

          <!-- Pestañas Interactivas Directas (Llenar formato vs Ver registros) -->
          <div class="station-header-actions" *ngIf="station.hasTabs">
            <div class="station-tab-pills">
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="3" y1="15" x2="21" y2="15"></line>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
                <span>Ver registros</span>
                <span class="tab-count-badge">{{ currentRecordsCount() }}</span>
              </button>
            </div>
          </div>
        </header>

        <!-- BANNER DE FEEDBACK TEMPORAL -->
        <div *ngIf="feedbackMessage()" class="alert-feedback-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{{ feedbackMessage() }}</span>
        </div>

        <!-- ======================================================== -->
        <!-- SUB-VISTA A: LLENAR FORMATO (MODERNO CON CARDS NUMERADAS)-->
        <!-- ======================================================== -->
        <div *ngIf="ui.activeTab() === 'form' && station.hasTabs" class="form-view-container">
          
          <!-- FORMULARIO 1: INGRESO DE MATERIAS PRIMAS -->
          <form *ngIf="ui.activeModule() === 'mp-ingreso'" (ngSubmit)="guardarIngresoMP()" class="form-flow">
            
            <!-- Card 1: Identificación y Homologación -->
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">1</div>
                  <div>
                    <h3 class="lap-card__title">Identificación y Homologación del Insumo</h3>
                    <p class="lap-card__subtitle">Datos técnicos de origen y laboratorio homologado bajo norma GMP</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Materia Prima / Principio Activo <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.producto"
                    name="producto"
                    required
                    placeholder="Ej. Ácido Hialurónico Puro 2%"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Código Interno de Insumo <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.codigoInsumo"
                    name="codigoInsumo"
                    required
                    placeholder="MP-AH-001"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Proveedor Homologado <span class="req">*</span></label>
                  <select [(ngModel)]="formMp.proveedor" name="proveedor" required class="field-select">
                    <option value="Merck KGaA Laboratorios">Merck KGaA Laboratorios (Alemania)</option>
                    <option value="BASF Nutrition & Health">BASF Nutrition & Health</option>
                    <option value="Croda Personal Care">Croda Personal Care</option>
                    <option value="Evonik Industries AG">Evonik Industries AG</option>
                    <option value="Givaudan Active Beauty">Givaudan Active Beauty</option>
                    <option value="Indena Pharma Extracts">Indena Pharma Extracts</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Orden de Compra / Remisión <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.ordenCompra"
                    name="ordenCompra"
                    placeholder="OC-2026-9041"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">País / Laboratorio Fabricante</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.paisOrigen"
                    name="paisOrigen"
                    placeholder="Alemania (Darmstadt)"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Tipo de Grado Farmacopéico</label>
                  <select class="field-select">
                    <option value="USP">Grado USP (United States Pharmacopeia)</option>
                    <option value="EP">Grado EP (European Pharmacopoeia)</option>
                    <option value="COSMETICO">Grado Cosmético Certificado</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Card 2: Control de Lote, Cantidad & Fechas -->
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">2</div>
                  <div>
                    <h3 class="lap-card__title">Control de Lote, Cantidad Recibida & Fechas</h3>
                    <p class="lap-card__subtitle">Trazabilidad por lote y balance estricto de pesada de ingreso</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Lote del Fabricante / Proveedor <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.loteProveedor"
                    name="loteProveedor"
                    required
                    placeholder="LOT-MERCK-8831"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Lote Interno Asignado <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.loteInterno"
                    name="loteInterno"
                    required
                    placeholder="MP-2026-0512"
                    class="field-input font-mono"
                  />
                </div>

                <!-- Grupo Cantidad + Selector de Unidad Conectado -->
                <div class="form-field">
                  <label class="field-label">Cantidad Recibida & Unidad <span class="req">*</span></label>
                  <div class="quantity-unit-group">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      [(ngModel)]="formMp.cantidadRecibida"
                      name="cantidadRecibida"
                      required
                      placeholder="25.000"
                      class="field-input group-input"
                    />
                    <select [(ngModel)]="formMp.unidades" name="unidades" class="group-select">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                      <option value="UN">UN</option>
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label class="field-label">Precio Unitario ($ / Unidad)</label>
                  <input
                    type="number"
                    step="100"
                    [(ngModel)]="formMp.precioPorUnidad"
                    name="precioPorUnidad"
                    placeholder="185000"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Fecha de Recepción en Planta <span class="req">*</span></label>
                  <input
                    type="date"
                    [(ngModel)]="formMp.fechaRecepcion"
                    name="fechaRecepcion"
                    required
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Fecha de Vencimiento / Reanálisis <span class="req">*</span></label>
                  <input
                    type="date"
                    [(ngModel)]="formMp.fechaVencimiento"
                    name="fechaVencimiento"
                    required
                    class="field-input"
                  />
                </div>
              </div>

              <!-- Resumen de Costo Total Calculado -->
              <div class="cost-summary-box">
                <div class="cost-summary-item">
                  <span class="cost-summary-label">CANTIDAD REGISTRADA</span>
                  <span class="cost-summary-value">{{ formMp.cantidadRecibida || 0 }} {{ formMp.unidades }}</span>
                </div>
                <div class="cost-summary-item">
                  <span class="cost-summary-label">PRECIO BASE UNITARIO</span>
                  <span class="cost-summary-value">$ {{ (formMp.precioPorUnidad || 0).toLocaleString('es-CO') }} / {{ formMp.unidades }}</span>
                </div>
                <div class="cost-summary-item cost-summary-item--highlight">
                  <span class="cost-summary-label">VALOR TOTAL DE ENTRADA</span>
                  <span class="cost-summary-total">$ {{ ((formMp.cantidadRecibida || 0) * (formMp.precioPorUnidad || 0)).toLocaleString('es-CO') }}</span>
                </div>
              </div>
            </div>

            <!-- Card 3: Criterios de Calidad GMP & Certificado COA -->
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">3</div>
                  <div>
                    <h3 class="lap-card__title">Criterios de Calidad Organoléptica & COA</h3>
                    <p class="lap-card__subtitle">Verificación sensorial y adjunto de Certificado de Análisis del Fabricante</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Aspecto Físico</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.aspecto"
                    name="aspecto"
                    placeholder="Polvo cristalino homogéneo"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Color & Olor</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.colorOlor"
                    name="colorOlor"
                    placeholder="Inodoro / Blanco puro característico"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">pH / Densidad / Pureza</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.phDensidad"
                    name="phDensidad"
                    placeholder="pH: 6.45 (solución 1%) / Pureza: 99.2%"
                    class="field-input"
                  />
                </div>
              </div>

              <!-- Uploader de Certificado de Análisis (COA) -->
              <div class="coa-dropzone-box">
                <div class="coa-dropzone-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div class="coa-dropzone-info">
                  <strong>Certificado de Análisis (COA) del Fabricante</strong>
                  <span>Archivo vinculado: {{ formMp.coaArchivo }} (Verificado conforme especificación USP)</span>
                </div>
                <span class="badge-approved-tag">COA VERIFICADO</span>
              </div>

              <!-- Dictamen de Calidad Inicial (Titanio & Cian Glacial, SIN ROJO NI AMARILLO) -->
              <div class="status-selection-wrap">
                <label class="field-label">Dictamen de Calidad Inicial en Recepción:</label>
                <div class="status-btn-group">
                  <button
                    type="button"
                    class="status-choice-btn"
                    [class.status-choice-btn--approved]="formMp.estadoCalidad === 'Aprobado'"
                    (click)="formMp.estadoCalidad = 'Aprobado'"
                  >
                    <span class="status-dot-approved"></span>
                    <span>Aprobado (Liberado a Planta)</span>
                  </button>

                  <button
                    type="button"
                    class="status-choice-btn"
                    [class.status-choice-btn--quarantine]="formMp.estadoCalidad === 'Cuarentena'"
                    (click)="formMp.estadoCalidad = 'Cuarentena'"
                  >
                    <span class="status-dot-quarantine"></span>
                    <span>En Cuarentena (En Análisis)</span>
                  </button>

                  <button
                    type="button"
                    class="status-choice-btn"
                    [class.status-choice-btn--rejected]="formMp.estadoCalidad === 'Rechazado'"
                    (click)="formMp.estadoCalidad = 'Rechazado'"
                  >
                    <span class="status-dot-rejected"></span>
                    <span>Rechazado (No Conforme)</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Card 4: Despeje de Área & Responsable -->
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">4</div>
                  <div>
                    <h3 class="lap-card__title">Despeje de Área & Responsable de Recepción</h3>
                    <p class="lap-card__subtitle">Registro de condiciones de pesada y químico farmacéutico receptor</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Analista / Químico Receptor</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.liberadoPor"
                    name="liberadoPor"
                    readonly
                    class="field-input field-input--readonly"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Temperatura de Recepción</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.temperatura"
                    name="temperatura"
                    placeholder="20.5 °C"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Humedad Relativa (% HR)</label>
                  <input
                    type="text"
                    [(ngModel)]="formMp.humedad"
                    name="humedad"
                    placeholder="45 % HR"
                    class="field-input"
                  />
                </div>

                <div class="form-field form-field--full">
                  <label class="field-label">Observaciones Técnicas de Empaque y Precinto</label>
                  <textarea
                    [(ngModel)]="formMp.observaciones"
                    name="observaciones"
                    rows="3"
                    class="field-textarea"
                    placeholder="Empaque hermético de grado farmacéutico, rotulación conforme y lote coincidente."
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Acciones de Pie de Formulario -->
            <div class="form-actions-bar">
              <button type="submit" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>Guardar y Registrar Entrada GMP</span>
              </button>

              <button type="button" (click)="resetFormMp()" class="btn btn-secondary">
                <span>Limpiar Formulario</span>
              </button>

              <button type="button" (click)="setTab('list')" class="btn btn-text">
                <span>Ir a Ver Registros</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </form>

          <!-- OTROS FORMULARIOS DINÁMICOS SEGÚN ESTACIÓN -->
          <!-- FORMULARIO 2: CONSUMO EN REACTORES -->
          <form *ngIf="ui.activeModule() === 'mp-consumo'" (ngSubmit)="guardarConsumoMP()" class="form-flow">
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">1</div>
                  <div>
                    <h3 class="lap-card__title">Dosificación y Consumo en Reactores</h3>
                    <p class="lap-card__subtitle">Pesada analítica y balance atómico para orden de formulación magistral</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Orden de Mezcla / Formulación <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formConsumo.ordenMezcla"
                    name="ordenMezcla"
                    required
                    placeholder="OM-2026-0042"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Reactor de Destino <span class="req">*</span></label>
                  <select [(ngModel)]="formConsumo.reactor" name="reactor" required class="field-select">
                    <option value="Reactor Principal R-01 (1000L)">Reactor Principal R-01 (1000 L)</option>
                    <option value="Reactor Piloto R-02 (250L)">Reactor Piloto R-02 (250 L)</option>
                    <option value="Marmita Homogeneizadora M-01 (500L)">Marmita Homogeneizadora M-01 (500 L)</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Materia Prima a Dosificar <span class="req">*</span></label>
                  <select [(ngModel)]="formConsumo.materiaPrima" name="materiaPrima" required class="field-select">
                    <option *ngFor="let mp of recordsMpIngreso" [value]="mp.producto">
                      {{ mp.producto }} (Lote: {{ mp.loteInterno }})
                    </option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Lote de Insumo Seleccionado <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formConsumo.loteConsumido"
                    name="loteConsumido"
                    required
                    placeholder="MP-2026-0512"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Cantidad a Dosificar <span class="req">*</span></label>
                  <div class="quantity-unit-group">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      [(ngModel)]="formConsumo.cantidadDosificada"
                      name="cantidadDosificada"
                      required
                      placeholder="12.500"
                      class="field-input group-input"
                    />
                    <select [(ngModel)]="formConsumo.unidad" name="unidad" class="group-select">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="mL">mL</option>
                    </select>
                  </div>
                </div>

                <div class="form-field">
                  <label class="field-label">Responsable de Pesada</label>
                  <input
                    type="text"
                    [(ngModel)]="formConsumo.responsablePesada"
                    name="responsablePesada"
                    readonly
                    class="field-input field-input--readonly"
                  />
                </div>
              </div>
            </div>

            <div class="form-actions-bar">
              <button type="submit" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
                <span>Registrar Dosificación en Reactor</span>
              </button>
              <button type="button" (click)="setTab('list')" class="btn btn-secondary">
                <span>Ver Consumos Registrados</span>
              </button>
            </div>
          </form>

          <!-- FORMULARIO 3: AGREGAR CLIENTE -->
          <form *ngIf="ui.activeModule() === 'clientes'" (ngSubmit)="guardarCliente()" class="form-flow">
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">1</div>
                  <div>
                    <h3 class="lap-card__title">Registro de Cliente Comercial & Distribuidor</h3>
                    <p class="lap-card__subtitle">Homologación de cuentas para despacho de productos terminados</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Razón Social / Nombre Comercial <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formCliente.razonSocial"
                    name="razonSocial"
                    required
                    placeholder="DermoSalud Especializada S.A.S"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">NIT / Identificación Fiscal <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formCliente.nit"
                    name="nit"
                    required
                    placeholder="900.542.118-2"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Contacto Responsable</label>
                  <input
                    type="text"
                    [(ngModel)]="formCliente.contacto"
                    name="contacto"
                    placeholder="Dra. Juliana Martínez (Compras)"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Correo Electrónico de Facturación</label>
                  <input
                    type="email"
                    [(ngModel)]="formCliente.correo"
                    name="correo"
                    placeholder="compras@dermosallud.com"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Teléfono de Despacho</label>
                  <input
                    type="text"
                    [(ngModel)]="formCliente.telefono"
                    name="telefono"
                    placeholder="+57 (601) 840 2200"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Ciudad de Entrega</label>
                  <input
                    type="text"
                    [(ngModel)]="formCliente.ciudad"
                    name="ciudad"
                    placeholder="Bogotá D.C."
                    class="field-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-actions-bar">
              <button type="submit" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
                <span>Registrar Cliente Comercial</span>
              </button>
              <button type="button" (click)="setTab('list')" class="btn btn-secondary">
                <span>Ver Directorio de Clientes</span>
              </button>
            </div>
          </form>

          <!-- FORMULARIO 4: AGREGAR PRODUCTO -->
          <form *ngIf="ui.activeModule() === 'productos'" (ngSubmit)="guardarProducto()" class="form-flow">
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">1</div>
                  <div>
                    <h3 class="lap-card__title">Catálogo de Productos & Formulaciones Galénicas</h3>
                    <p class="lap-card__subtitle">Registro de especificaciones técnicas y presentación comercial</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Código Galénico Único <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formProducto.codigoGalenico"
                    name="codigoGalenico"
                    required
                    placeholder="PROD-SERUM-01"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Nombre Comercial del Producto <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formProducto.nombreComercial"
                    name="nombreComercial"
                    required
                    placeholder="Sérum Restaurador Hialurónico B5"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Presentación Comercial</label>
                  <input
                    type="text"
                    [(ngModel)]="formProducto.presentacion"
                    name="presentacion"
                    placeholder="Frasco Gotero Vidrio Ámbar 30 mL"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">pH Objetivo Especificado</label>
                  <input
                    type="text"
                    [(ngModel)]="formProducto.phObjetivo"
                    name="phObjetivo"
                    placeholder="5.20 - 5.60"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Densidad Teórica (g/mL)</label>
                  <input
                    type="text"
                    [(ngModel)]="formProducto.densidadObjetivo"
                    name="densidadObjetivo"
                    placeholder="1.015 - 1.035"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Vida Útil (Meses)</label>
                  <input
                    type="number"
                    [(ngModel)]="formProducto.vidaUtilMeses"
                    name="vidaUtilMeses"
                    placeholder="24"
                    class="field-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-actions-bar">
              <button type="submit" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
                <span>Guardar Producto en Catálogo</span>
              </button>
              <button type="button" (click)="setTab('list')" class="btn btn-secondary">
                <span>Ver Catálogo de Productos</span>
              </button>
            </div>
          </form>

          <!-- FORMULARIO 5: ORDEN DE PEDIDO -->
          <form *ngIf="ui.activeModule() === 'pedidos'" (ngSubmit)="guardarPedido()" class="form-flow">
            <div class="lap-card">
              <div class="lap-card__header">
                <div class="lap-card__title-wrap">
                  <div class="lap-card__icon-box">1</div>
                  <div>
                    <h3 class="lap-card__title">Creación de Orden de Pedido Comercial</h3>
                    <p class="lap-card__subtitle">Asignación de unidades requeridas y programación de despacho</p>
                  </div>
                </div>
              </div>

              <div class="form-grid form-grid--3">
                <div class="form-field">
                  <label class="field-label">Número de Pedido <span class="req">*</span></label>
                  <input
                    type="text"
                    [(ngModel)]="formPedido.numeroPedido"
                    name="numeroPedido"
                    required
                    placeholder="PED-2026-0812"
                    class="field-input font-mono"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Cliente Solicitante <span class="req">*</span></label>
                  <select [(ngModel)]="formPedido.cliente" name="cliente" required class="field-select">
                    <option *ngFor="let c of recordsClientes" [value]="c.razonSocial">{{ c.razonSocial }}</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Producto Solicitado <span class="req">*</span></label>
                  <select [(ngModel)]="formPedido.producto" name="producto" required class="field-select">
                    <option *ngFor="let p of recordsProductos" [value]="p.nombreComercial">{{ p.nombreComercial }}</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Cantidad de Unidades <span class="req">*</span></label>
                  <input
                    type="number"
                    min="1"
                    [(ngModel)]="formPedido.cantidadUnidades"
                    name="cantidadUnidades"
                    required
                    placeholder="500"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Fecha Estimada de Entrega</label>
                  <input
                    type="date"
                    [(ngModel)]="formPedido.fechaEntregaEstimada"
                    name="fechaEntregaEstimada"
                    class="field-input"
                  />
                </div>

                <div class="form-field">
                  <label class="field-label">Nivel de Prioridad</label>
                  <select [(ngModel)]="formPedido.prioridad" name="prioridad" class="field-select">
                    <option value="ESTÁNDAR">Estándar (Despacho habitual)</option>
                    <option value="ALTA">Alta Prioridad (Clínica / Hospital)</option>
                    <option value="URGENTE">Urgente Inmediata</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-actions-bar">
              <button type="submit" class="btn btn-primary btn-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                </svg>
                <span>Generar Orden de Pedido</span>
              </button>
              <button type="button" (click)="setTab('list')" class="btn btn-secondary">
                <span>Ver Historial de Pedidos</span>
              </button>
            </div>
          </form>

        </div>

        <!-- ======================================================== -->
        <!-- SUB-VISTA B: VER REGISTROS (TABLA RESPONSIVA DE PRECISIÓN)-->
        <!-- ======================================================== -->
        <div *ngIf="ui.activeTab() === 'list' || !station.hasTabs" class="list-view-container">
          
          <!-- BARRA DE BÚSQUEDA Y FILTROS -->
          <div class="records-filter-bar">
            <div class="filter-left-group">
              <div class="search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  class="search-input"
                  placeholder="Buscar por lote interno, lote proveedor, insumo o entidad..."
                  [(ngModel)]="searchTerm"
                />
              </div>

              <!-- Filtro de Estado de Calidad -->
              <div class="filter-select-wrap" *ngIf="ui.activeModule() === 'mp-ingreso'">
                <span class="filter-label">Estado:</span>
                <select class="filter-select" [(ngModel)]="filtroEstado">
                  <option value="TODOS">Todos los estados</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Cuarentena">Cuarentena</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>

              <!-- Filtro de Fecha -->
              <div class="filter-date-wrap">
                <span class="filter-label">Fecha:</span>
                <input type="date" class="filter-date-input" [(ngModel)]="filtroFecha" />
              </div>

              <!-- Botón Limpiar Filtros -->
              <button
                *ngIf="searchTerm || filtroEstado !== 'TODOS' || filtroFecha"
                type="button"
                (click)="limpiarFiltros()"
                class="btn-clear-filters"
                title="Restablecer filtros"
              >
                Limpiar
              </button>
            </div>

            <div class="filter-right-group">
              <span class="filter-label">Mostrar:</span>
              <select class="filter-select" [(ngModel)]="pageSize">
                <option [ngValue]="10">10 por pág.</option>
                <option [ngValue]="25">25 por pág.</option>
                <option [ngValue]="50">50 por pág.</option>
              </select>

              <button *ngIf="station.hasTabs" type="button" class="btn btn-primary btn-sm" (click)="setTab('form')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Nuevo Formato</span>
              </button>
            </div>
          </div>

          <!-- TABLA 1: REGISTROS DE INGRESO DE MATERIAS PRIMAS -->
          <div *ngIf="ui.activeModule() === 'mp-ingreso'" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th style="width: 110px; min-width: 110px;">LOTE INTERNO</th>
                    <th style="width: 180px; min-width: 180px;">MATERIA PRIMA</th>
                    <th style="width: 110px; min-width: 110px; text-align: center;">F. RECEPCIÓN</th>
                    <th style="width: 140px; min-width: 140px;">PROVEEDOR</th>
                    <th style="width: 105px; min-width: 105px;">LOTE PROV.</th>
                    <th style="width: 95px; min-width: 95px; text-align: right;">CANTIDAD</th>
                    <th style="width: 110px; min-width: 110px; text-align: right;">PRECIO / KG</th>
                    <th style="width: 105px; min-width: 105px; text-align: center;">F. VENCE</th>
                    <th style="width: 100px; min-width: 100px; text-align: center;">ESTADO</th>
                    <th style="width: 115px; min-width: 115px; text-align: center;">FIRMADO POR</th>
                    <th style="width: 90px; min-width: 90px; text-align: center;">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngIf="filteredMpIngresos().length === 0">
                    <td colspan="11" class="empty-table-cell">
                      No se encontraron registros de materias primas con los filtros aplicados.
                    </td>
                  </tr>

                  <tr *ngFor="let reg of filteredMpIngresos()">
                    <!-- Lote Interno -->
                    <td>
                      <span class="lote-tag">{{ reg.loteInterno }}</span>
                    </td>

                    <!-- Materia Prima -->
                    <td>
                      <div class="table-cell-title">{{ reg.producto }}</div>
                      <div class="table-cell-sub">{{ reg.codigoInsumo }}</div>
                    </td>

                    <!-- Fecha Recepción -->
                    <td style="text-align: center; white-space: nowrap; font-size: 12px; color: #475569;">
                      {{ reg.fechaRecepcion }}
                    </td>

                    <!-- Proveedor -->
                    <td style="font-size: 12.5px; color: #334155;">
                      {{ reg.proveedor }}
                    </td>

                    <!-- Lote Proveedor -->
                    <td>
                      <span class="prov-tag">{{ reg.loteProveedor }}</span>
                    </td>

                    <!-- Cantidad Recibida -->
                    <td style="text-align: right;">
                      <span class="table-qty-bold">{{ reg.cantidadRecibida }}</span>
                      <span class="unit-badge">{{ reg.unidades }}</span>
                    </td>

                    <!-- Precio / Costo -->
                    <td style="text-align: right;">
                      <div class="table-price-cell">
                        <span class="table-price-bold">$ {{ reg.precioPorUnidad.toLocaleString('es-CO') }}</span>
                        <small class="table-price-sub">Tot: $ {{ reg.costoTotal.toLocaleString('es-CO') }}</small>
                      </div>
                    </td>

                    <!-- Fecha Vence -->
                    <td style="text-align: center; white-space: nowrap; font-size: 12px; color: #475569;">
                      {{ reg.fechaVencimiento }}
                    </td>

                    <!-- Estado de Calidad (Titanio & Cian, SIN ROJO NI AMARILLO) -->
                    <td style="text-align: center;">
                      <span
                        class="status-pill"
                        [class.status-pill--approved]="reg.estadoCalidad === 'Aprobado'"
                        [class.status-pill--quarantine]="reg.estadoCalidad === 'Cuarentena'"
                        [class.status-pill--rejected]="reg.estadoCalidad === 'Rechazado'"
                      >
                        {{ reg.estadoCalidad }}
                      </span>
                    </td>

                    <!-- Firmado Por -->
                    <td style="text-align: center;">
                      <div class="signature-tag" title="Revisado y firmado por analista">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>{{ reg.liberadoPor.split(' ')[0] }}</span>
                      </div>
                    </td>

                    <!-- Acciones de Fila -->
                    <td style="text-align: center;">
                      <div class="action-buttons-wrap">
                        <button
                          type="button"
                          class="action-btn action-btn--view"
                          title="Ver detalle técnico completo"
                          (click)="openDetailModal(reg)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          class="action-btn action-btn--edit"
                          title="Editar registro"
                          (click)="openEditModal(reg)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </button>

                        <button
                          type="button"
                          class="action-btn action-btn--delete"
                          title="Eliminar registro"
                          (click)="eliminarIngreso(reg)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación Inferior -->
            <div class="records-pagination">
              <div class="records-count">
                Mostrando {{ filteredMpIngresos().length === 0 ? 0 : 1 }} a {{ filteredMpIngresos().length }} de {{ filteredMpIngresos().length }} registros
              </div>
              <div class="pagination-controls">
                <button type="button" class="page-btn" disabled>Anterior</button>
                <button type="button" class="page-btn page-btn--active">1</button>
                <button type="button" class="page-btn" disabled>Siguiente</button>
              </div>
            </div>
          </div>

          <!-- TABLA 2: REGISTROS DE CONSUMO Y PESADA EN REACTORES -->
          <div *ngIf="ui.activeModule() === 'mp-consumo'" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>ORDEN DE MEZCLA</th>
                    <th>REACTOR ASIGNADO</th>
                    <th>MATERIA PRIMA DOSIFICADA</th>
                    <th>LOTE INSUMO</th>
                    <th style="text-align: right;">CANTIDAD PESADA</th>
                    <th style="text-align: center;">FECHA Y HORA</th>
                    <th style="text-align: center;">RESPONSABLE</th>
                    <th style="text-align: center;">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of recordsConsumo">
                    <td><span class="lote-tag">{{ item.ordenMezcla }}</span></td>
                    <td><strong>{{ item.reactor }}</strong></td>
                    <td>{{ item.materiaPrima }}</td>
                    <td><span class="prov-tag">{{ item.loteConsumido }}</span></td>
                    <td style="text-align: right;">
                      <span class="table-qty-bold">{{ item.cantidadDosificada }}</span>
                      <span class="unit-badge">{{ item.unidad }}</span>
                    </td>
                    <td style="text-align: center; font-size: 12px; color: #475569;">{{ item.fechaConsumo }}</td>
                    <td style="text-align: center;">{{ item.responsablePesada }}</td>
                    <td style="text-align: center;">
                      <span class="status-pill status-pill--approved">{{ item.estado }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TABLA 3: DIRECTORIO DE CLIENTES -->
          <div *ngIf="ui.activeModule() === 'clientes'" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>NIT</th>
                    <th>RAZÓN SOCIAL</th>
                    <th>CONTACTO</th>
                    <th>CORREO ELECTRÓNICO</th>
                    <th>TELÉFONO</th>
                    <th>CIUDAD</th>
                    <th style="text-align: center;">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cli of recordsClientes">
                    <td><span class="lote-tag">{{ cli.nit }}</span></td>
                    <td><strong>{{ cli.razonSocial }}</strong></td>
                    <td>{{ cli.contacto }}</td>
                    <td>{{ cli.correo }}</td>
                    <td>{{ cli.telefono }}</td>
                    <td>{{ cli.ciudad }}</td>
                    <td style="text-align: center;">
                      <span class="status-pill status-pill--approved">{{ cli.estado }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TABLA 4: CATÁLOGO DE PRODUCTOS -->
          <div *ngIf="ui.activeModule() === 'productos'" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>CÓDIGO GALÉNICO</th>
                    <th>PRODUCTO TERMINADO</th>
                    <th>PRESENTACIÓN</th>
                    <th style="text-align: center;">ESPECIFICACIÓN pH</th>
                    <th style="text-align: center;">DENSIDAD</th>
                    <th style="text-align: center;">VIDA ÚTIL</th>
                    <th style="text-align: center;">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let prod of recordsProductos">
                    <td><span class="lote-tag">{{ prod.codigoGalenico }}</span></td>
                    <td><strong>{{ prod.nombreComercial }}</strong></td>
                    <td>{{ prod.presentacion }}</td>
                    <td style="text-align: center;">{{ prod.phObjetivo }}</td>
                    <td style="text-align: center;">{{ prod.densidadObjetivo }} g/mL</td>
                    <td style="text-align: center;">{{ prod.vidaUtilMeses }} Meses</td>
                    <td style="text-align: center;">
                      <span class="status-pill status-pill--approved">{{ prod.estado }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TABLA 5: ÓRDENES DE PEDIDO -->
          <div *ngIf="ui.activeModule() === 'pedidos'" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>N° PEDIDO</th>
                    <th>CLIENTE COMERCIAL</th>
                    <th>PRODUCTO SOLICITADO</th>
                    <th style="text-align: right;">CANTIDAD</th>
                    <th style="text-align: center;">F. ORDEN</th>
                    <th style="text-align: center;">F. ENTREGA</th>
                    <th style="text-align: center;">PRIORIDAD</th>
                    <th style="text-align: center;">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let ped of recordsPedidos">
                    <td><span class="lote-tag">{{ ped.numeroPedido }}</span></td>
                    <td><strong>{{ ped.cliente }}</strong></td>
                    <td>{{ ped.producto }}</td>
                    <td style="text-align: right;"><strong>{{ ped.cantidadUnidades }}</strong> UN</td>
                    <td style="text-align: center; font-size: 12px; color: #475569;">{{ ped.fechaOrden }}</td>
                    <td style="text-align: center; font-size: 12px; color: #475569;">{{ ped.fechaEntregaEstimada }}</td>
                    <td style="text-align: center;">
                      <span class="priority-badge">{{ ped.prioridad }}</span>
                    </td>
                    <td style="text-align: center;">
                      <span class="status-pill status-pill--approved">{{ ped.estado }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TABLA GENÉRICA PARA OTRAS ESTACIONES -->
          <div *ngIf="!['mp-ingreso', 'mp-consumo', 'clientes', 'productos', 'pedidos'].includes(ui.activeModule())" class="records-table-container">
            <div class="records-table-wrap">
              <table class="records-table">
                <thead>
                  <tr>
                    <th>CÓDIGO / LOTE TÉCNICO</th>
                    <th>DESCRIPCIÓN DEL PROCESO</th>
                    <th>FECHA DE REGISTRO</th>
                    <th>NORMATIVA</th>
                    <th style="text-align: center;">ESTADO OPERATIVO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="lote-tag">{{ station.code }}-2026-001</span></td>
                    <td><strong>{{ station.title }}</strong> (Registro inicial validado)</td>
                    <td>2026-10-20</td>
                    <td><span class="unit-badge">GMP / BPM</span></td>
                    <td style="text-align: center;"><span class="status-pill status-pill--approved">Operativo</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- MODAL DETALLE COMPLETO DEL LOTE                          -->
        <!-- ======================================================== -->
        <div *ngIf="selectedDetailItem" class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div>
                  <h3 class="modal-title">Ficha Técnica GMP — Lote {{ selectedDetailItem.loteInterno }}</h3>
                  <p class="modal-sub">Inspección de calidad y homologación en recepción</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeDetailModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-card">
                  <span class="detail-card-label">MATERIA PRIMA</span>
                  <strong class="detail-card-value">{{ selectedDetailItem.producto }}</strong>
                  <span class="detail-card-sub">Código: {{ selectedDetailItem.codigoInsumo }}</span>
                </div>

                <div class="detail-card">
                  <span class="detail-card-label">PROVEEDOR HOMOLOGADO</span>
                  <strong class="detail-card-value">{{ selectedDetailItem.proveedor }}</strong>
                  <span class="detail-card-sub">Lote Prov: {{ selectedDetailItem.loteProveedor }}</span>
                </div>

                <div class="detail-card">
                  <span class="detail-card-label">CANTIDAD Y PRECIO</span>
                  <strong class="detail-card-value">{{ selectedDetailItem.cantidadRecibida }} {{ selectedDetailItem.unidades }}</strong>
                  <span class="detail-card-sub">Total: $ {{ selectedDetailItem.costoTotal.toLocaleString('es-CO') }}</span>
                </div>

                <div class="detail-card">
                  <span class="detail-card-label">CRITERIOS ORGANOLÉPTICOS</span>
                  <strong class="detail-card-value">{{ selectedDetailItem.aspecto }}</strong>
                  <span class="detail-card-sub">{{ selectedDetailItem.phDensidad }}</span>
                </div>
              </div>

              <div class="detail-row-coa">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                  <strong>Certificado de Calidad (COA):</strong>
                  <span> {{ selectedDetailItem.coaArchivo }} — Dictamen Oficial: </span>
                  <span
                    class="status-pill status-pill--sm"
                    [class.status-pill--approved]="selectedDetailItem.estadoCalidad === 'Aprobado'"
                    [class.status-pill--quarantine]="selectedDetailItem.estadoCalidad === 'Cuarentena'"
                    [class.status-pill--rejected]="selectedDetailItem.estadoCalidad === 'Rechazado'"
                  >
                    {{ selectedDetailItem.estadoCalidad }}
                  </span>
                </div>
              </div>

              <div class="detail-obs-box">
                <span class="detail-card-label">OBSERVACIONES DE RECEPCIÓN</span>
                <p>{{ selectedDetailItem.observaciones || 'Sin observaciones adicionales registradas.' }}</p>
                <small>Firmado y validado por: <strong>{{ selectedDetailItem.liberadoPor }}</strong></small>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeDetailModal()">Cerrar Ficha</button>
            </div>
          </div>
        </div>

        <!-- ======================================================== -->
        <!-- MODAL EDITAR REGISTRO                                    -->
        <!-- ======================================================== -->
        <div *ngIf="selectedEditItem" class="modal-overlay" (click)="closeEditModal()">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-header-left">
                <div class="modal-badge-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="modal-title">Editar Materia Prima — Lote {{ selectedEditItem.loteInterno }}</h3>
                  <p class="modal-sub">Ajuste de datos de recepción y estado de calidad</p>
                </div>
              </div>
              <button type="button" class="modal-close-btn" (click)="closeEditModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-grid form-grid--2">
                <div class="form-field">
                  <label class="field-label">Nombre del Producto / Insumo</label>
                  <input type="text" [(ngModel)]="editForm.producto" class="field-input" />
                </div>

                <div class="form-field">
                  <label class="field-label">Proveedor</label>
                  <input type="text" [(ngModel)]="editForm.proveedor" class="field-input" />
                </div>

                <div class="form-field">
                  <label class="field-label">Cantidad Recibida</label>
                  <input type="number" step="0.001" [(ngModel)]="editForm.cantidadRecibida" class="field-input" />
                </div>

                <div class="form-field">
                  <label class="field-label">Precio Unitario ($)</label>
                  <input type="number" [(ngModel)]="editForm.precioPorUnidad" class="field-input" />
                </div>

                <div class="form-field">
                  <label class="field-label">Estado de Calidad</label>
                  <select [(ngModel)]="editForm.estadoCalidad" class="field-select">
                    <option value="Aprobado">Aprobado</option>
                    <option value="Cuarentena">Cuarentena</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div class="form-field">
                  <label class="field-label">Fecha de Vencimiento</label>
                  <input type="date" [(ngModel)]="editForm.fechaVencimiento" class="field-input" />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeEditModal()">Cancelar</button>
              <button type="button" class="btn btn-primary" (click)="guardarEdicion()">Guardar Cambios</button>
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
              <span class="metric-label">SEGURIDAD & SESIÓN</span>
              <span class="metric-value">JWT Activo (30 min con auto-renovación)</span>
            </div>

            <div class="metric-item">
              <span class="metric-label">AUDITORÍA</span>
              <span class="metric-value">Trazabilidad Bidireccional 360°</span>
            </div>
          </div>
        </div>

        <!-- Módulos Operativos Principales -->
        <div class="modules-section">
          <div class="section-header">
            <h2 class="section-title">Estaciones de Planta & Gestión de Manufactura</h2>
            <p class="section-subtitle">Selecciona una estación o usa el menú lateral para abrir formularios y registros</p>
          </div>

          <div class="modules-grid">
            
            <!-- Materias Primas -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">INSUMOS</span>
                <span class="module-code">EST-MP-01</span>
              </div>
              <h3>Ingreso de Materias Primas</h3>
              <p>Recepción técnica, control de cuarentena, pesada y archivo de Certificado de Análisis (COA).</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('mp-ingreso', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Consumo en Reactores -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">PRODUCCIÓN</span>
                <span class="module-code">EST-MP-02</span>
              </div>
              <h3>Consumo y Pesada en Reactores</h3>
              <p>Dosificación estricta de principios activos y balance atómico sin mermas no autorizadas.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('mp-consumo', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Control de Calidad -->
            <div class="card module-box highlight-box">
              <div class="module-top">
                <span class="module-tag tag-cyan">GMP / BPM</span>
                <span class="module-code code-cyan">EST-QC-01</span>
              </div>
              <h3>Liberación de Calidad</h3>
              <p>Dictamen analítico con trazabilidad total y estados PENDING, APPROVED y REJECTED.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('calidad-liberacion', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Clientes Comerciales -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">VENTAS</span>
                <span class="module-code">EST-CLI-01</span>
              </div>
              <h3>Gestión de Clientes</h3>
              <p>Directorio de distribuidores comerciales y homologación de cuentas de despacho.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('clientes', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Catálogo de Productos -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">FÓRMULAS</span>
                <span class="module-code">EST-PROD-01</span>
              </div>
              <h3>Catálogo de Productos</h3>
              <p>Fórmulas galénicas registradas, especificaciones físico-químicas y presentaciones comerciales.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('productos', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Órdenes de Pedido -->
            <div class="card module-box">
              <div class="module-top">
                <span class="module-tag">PEDIDOS</span>
                <span class="module-code">EST-PED-01</span>
              </div>
              <h3>Órdenes de Pedido</h3>
              <p>Registro y seguimiento de despachos comerciales a clientes y distribuidores autorizados.</p>
              <div class="module-foot">
                <button class="module-link-btn" (click)="openModule('pedidos', 'list')">
                  <span>Abrir estación</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>

      </section>

    </div>
  `,
  styles: [`
    /* ======================================================== */
    /* ENCABEZADO DE ESTACIÓN MODERNO (SIN BREADCRUMBS)         */
    /* ======================================================== */
    .station-view-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .station-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.35rem 1.75rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    }

    .station-header-main {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      flex: 1;
      min-width: 280px;
    }

    .station-badge-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.25);
      color: #0891b2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(8, 145, 178, 0.08);
    }

    .station-header-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .station-tag-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
    }

    .station-code-badge {
      font-family: monospace;
      font-size: 0.725rem;
      font-weight: 800;
      color: #0891b2;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.25);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .station-domain-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
    }

    .station-cat-badge {
      font-size: 0.68rem;
      font-weight: 600;
      color: #64748b;
    }

    .station-title {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
      line-height: 1.2;
    }

    .station-desc {
      font-size: 0.85rem;
      color: #475569;
      margin: 0;
      max-width: 680px;
      line-height: 1.4;
    }

    .station-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Pestañas Interactivas (Llenar formato vs Ver registros) */
    .station-tab-pills {
      display: inline-flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
      gap: 4px;
      border: 1px solid #e2e8f0;
    }

    .tab-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 1.15rem;
      border-radius: 9px;
      border: none;
      background: transparent;
      color: #475569;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }

    .tab-pill:hover {
      color: #0f172a;
      background: rgba(255, 255, 255, 0.6);
    }

    .tab-pill--active {
      background: #0f172a !important;
      color: #ffffff !important;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    }

    .tab-count-badge {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      margin-left: 2px;
    }

    .tab-pill:not(.tab-pill--active) .tab-count-badge {
      background: #e2e8f0;
      color: #475569;
    }

    /* Banner de Feedback */
    .alert-feedback-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.3);
      color: #0891b2;
      border-radius: 12px;
      padding: 0.95rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(8, 145, 178, 0.08);
      animation: fadeIn 0.25s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ======================================================== */
    /* DISEÑO DE FORMATOS (CARDS NUMERADAS INDUSTRIALES)       */
    /* ======================================================== */
    .form-view-container {
      width: 100%;
    }

    .form-flow {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .lap-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.65rem 1.85rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
      transition: border-color 0.15s ease;
    }

    .lap-card:hover {
      border-color: #cbd5e1;
    }

    .lap-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.95rem;
    }

    .lap-card__title-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .lap-card__icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #0f172a;
      color: #06b6d4;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.875rem;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);
    }

    .lap-card__title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .lap-card__subtitle {
      margin: 2px 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }

    /* Grillas de Formulario */
    .form-grid {
      display: grid;
      gap: 1.15rem;
    }

    .form-grid--2 {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    .form-grid--3 {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-field--full {
      grid-column: 1 / -1;
    }

    .field-label {
      font-size: 0.725rem;
      font-weight: 700;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .req {
      color: #0891b2;
      font-weight: 800;
      margin-left: 2px;
    }

    .field-input,
    .field-select {
      width: 100%;
      height: 42px;
      padding: 0 0.85rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #0f172a;
      font-size: 0.85rem;
      font-family: inherit;
      transition: all 0.15s ease;
      outline: none;
    }

    .field-input:focus,
    .field-select:focus,
    .field-textarea:focus {
      background: #ffffff;
      border-color: #0891b2;
      box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.18);
    }

    .field-input--readonly {
      background: #f1f5f9;
      color: #64748b;
      cursor: not-allowed;
    }

    .field-textarea {
      width: 100%;
      padding: 0.75rem 0.85rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      color: #0f172a;
      font-size: 0.85rem;
      font-family: inherit;
      outline: none;
      resize: vertical;
      transition: all 0.15s ease;
    }

    .font-mono {
      font-family: monospace;
      font-weight: 600;
    }

    /* Input de Cantidad con Selector de Unidad Conectado */
    .quantity-unit-group {
      display: flex;
      align-items: stretch;
      width: 100%;
    }

    .group-input {
      border-top-right-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
      border-right: none !important;
      flex: 1;
    }

    .group-select {
      width: 80px;
      min-width: 80px;
      max-width: 80px;
      height: 42px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
      color: #0891b2;
      font-weight: 800;
      font-size: 0.85rem;
      text-align: center;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;
    }

    .group-select:focus {
      background: #ffffff;
      border-color: #0891b2;
    }

    /* Caja de Resumen de Costo Total */
    .cost-summary-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.15rem 1.35rem;
      background: linear-gradient(135deg, #f8fafc 0%, #ecfeff 100%);
      border: 1px solid rgba(8, 145, 178, 0.25);
      border-radius: 12px;
      margin-top: 0.5rem;
    }

    .cost-summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .cost-summary-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: #0891b2;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .cost-summary-value {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .cost-summary-total {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0891b2;
      letter-spacing: -0.02em;
    }

    /* Dropzone de Certificado de Análisis (COA) */
    .coa-dropzone-box {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      padding: 1.15rem 1.35rem;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      transition: all 0.18s ease;
    }

    .coa-dropzone-box:hover {
      background: #ecfeff;
      border-color: #0891b2;
    }

    .coa-dropzone-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #ecfeff;
      color: #0891b2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .coa-dropzone-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .coa-dropzone-info strong {
      font-size: 0.85rem;
      color: #0f172a;
    }

    .coa-dropzone-info span {
      font-size: 0.78rem;
      color: #64748b;
    }

    .badge-approved-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: #0891b2;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.3);
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      white-space: nowrap;
    }

    /* Botones de Dictamen de Calidad (Titanio & Cian, SIN ROJO NI AMARILLO) */
    .status-selection-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .status-btn-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .status-choice-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.15rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .status-choice-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .status-dot-approved {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0891b2;
    }

    .status-dot-quarantine {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #475569;
    }

    .status-dot-rejected {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0f172a;
    }

    .status-choice-btn--approved {
      background: #ecfeff !important;
      border-color: #0891b2 !important;
      color: #0891b2 !important;
      box-shadow: 0 0 0 2px rgba(8, 145, 178, 0.15);
    }

    .status-choice-btn--quarantine {
      background: #f1f5f9 !important;
      border-color: #475569 !important;
      color: #334155 !important;
      box-shadow: 0 0 0 2px rgba(71, 85, 105, 0.15);
    }

    .status-choice-btn--rejected {
      background: #0f172a !important;
      border-color: #0f172a !important;
      color: #ffffff !important;
      box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.25);
    }

    /* Barra de Acciones de Formulario */
    .form-actions-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
      padding: 1.35rem 0;
    }

    .btn-lg {
      padding: 0.75rem 1.65rem;
      font-size: 0.925rem;
    }

    .btn-sm {
      padding: 0.45rem 0.95rem;
      font-size: 0.78rem;
    }

    .btn-text {
      background: none;
      border: none;
      color: #0891b2;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    /* ======================================================== */
    /* DISEÑO DE REGISTROS (TABLA DE ALTA DENSIDAD RESPONSIVA)  */
    /* ======================================================== */
    .list-view-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .records-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.95rem 1.25rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);
    }

    .filter-left-group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
    }

    .filter-right-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 0 0.85rem;
      height: 38px;
      min-width: 280px;
      flex: 1;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.825rem;
      color: #0f172a;
    }

    .filter-select-wrap,
    .filter-date-wrap {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .filter-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 700;
    }

    .filter-select,
    .filter-date-input {
      height: 38px;
      padding: 0 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.8rem;
      outline: none;
    }

    .btn-clear-filters {
      height: 38px;
      padding: 0 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #f1f5f9;
      color: #475569;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-clear-filters:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Tabla Contenedora */
    .records-table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
      overflow: hidden;
      width: 100%;
    }

    .records-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .records-table-wrap::-webkit-scrollbar {
      height: 6px;
    }
    .records-table-wrap::-webkit-scrollbar-track {
      background: #f8fafc;
    }
    .records-table-wrap::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }
    .records-table-wrap::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .records-table {
      width: 100%;
      min-width: 960px;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.825rem;
    }

    .records-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.68rem;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #1e293b;
      white-space: nowrap;
    }

    .records-table td {
      padding: 9px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
      font-size: 0.825rem;
    }

    .records-table tr:hover td {
      background: #f8fafc;
    }

    .empty-table-cell {
      text-align: center;
      padding: 3rem !important;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    /* Tags y Píldoras de Celda */
    .lote-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.78rem;
      font-weight: 800;
      color: #0f172a;
      white-space: nowrap;
    }

    .prov-tag {
      font-family: monospace;
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
    }

    .table-cell-title {
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }

    .table-cell-sub {
      font-size: 0.725rem;
      color: #64748b;
      font-family: monospace;
    }

    .table-qty-bold {
      font-weight: 800;
      color: #0f172a;
    }

    .unit-badge {
      display: inline-flex;
      padding: 2px 6px;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.25);
      color: #0891b2;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 800;
      margin-left: 4px;
    }

    .table-price-cell {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1px;
    }

    .table-price-bold {
      font-weight: 700;
      color: #0891b2;
      font-size: 0.825rem;
    }

    .table-price-sub {
      font-size: 0.68rem;
      color: #94a3b8;
    }

    /* Píldoras de Estado (Titanio & Cian, SIN ROJO NI AMARILLO) */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .status-pill--sm {
      padding: 2px 7px;
      font-size: 0.68rem;
    }

    .status-pill--approved {
      background: #ecfeff;
      color: #0891b2;
      border: 1px solid rgba(8, 145, 178, 0.3);
    }

    .status-pill--quarantine {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .status-pill--rejected {
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #1e293b;
    }

    .priority-badge {
      display: inline-flex;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    .signature-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 7px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
    }

    /* Botones de Acción de Fila */
    .action-buttons-wrap {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
      padding: 0;
    }

    .action-btn--view {
      background: #ecfeff;
      color: #0891b2;
      border-color: rgba(8, 145, 178, 0.25);
    }

    .action-btn--view:hover {
      background: #0891b2;
      color: #ffffff;
      transform: translateY(-1px);
    }

    .action-btn--edit {
      background: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    .action-btn--edit:hover {
      background: #0f172a;
      color: #ffffff;
      transform: translateY(-1px);
    }

    .action-btn--delete {
      background: #f8fafc;
      color: #64748b;
      border-color: #e2e8f0;
    }

    .action-btn--delete:hover {
      background: #1e293b;
      color: #ffffff;
      transform: translateY(-1px);
    }

    /* Paginación */
    .records-pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      font-size: 0.8rem;
      color: #64748b;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #f1f5f9;
      color: #0f172a;
    }

    .page-btn--active {
      background: #0f172a !important;
      color: #ffffff !important;
      border-color: #0f172a !important;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* ======================================================== */
    /* MODALES FLOTANTES (DETALLE Y EDICIÓN)                     */
    /* ======================================================== */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.25rem;
      animation: fadeIn 0.2s ease;
    }

    .modal-dialog {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
      overflow: hidden;
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-header-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .modal-badge-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #ecfeff;
      color: #0891b2;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-title {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 800;
      color: #0f172a;
    }

    .modal-sub {
      margin: 2px 0 0 0;
      font-size: 0.78rem;
      color: #64748b;
    }

    .modal-close-btn {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .modal-close-btn:hover {
      background: #0f172a;
      color: #ffffff;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .detail-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-card-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .detail-card-value {
      font-size: 0.95rem;
      color: #0f172a;
    }

    .detail-card-sub {
      font-size: 0.75rem;
      color: #64748b;
      font-family: monospace;
    }

    .detail-row-coa {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #ecfeff;
      border: 1px solid rgba(8, 145, 178, 0.25);
      border-radius: 10px;
      padding: 0.85rem 1.15rem;
      font-size: 0.825rem;
      color: #0891b2;
    }

    .detail-obs-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .detail-obs-box p {
      margin: 0;
      font-size: 0.825rem;
      color: #334155;
      line-height: 1.4;
    }

    .detail-obs-box small {
      font-size: 0.725rem;
      color: #64748b;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }

    /* ======================================================== */
    /* VISTA DE DASHBOARD PRINCIPAL (INICIO)                    */
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
      gap: 4px;
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

  // Filtros reactivos para tablas
  searchTerm = '';
  filtroEstado = 'TODOS';
  filtroFecha = '';
  pageSize = 10;
  currentPage = 1;

  // Feedback temporal
  feedbackMessage = signal<string | null>(null);

  // Modales
  selectedDetailItem: IngresoMateriaPrimaItem | null = null;
  selectedEditItem: IngresoMateriaPrimaItem | null = null;
  editForm: Partial<IngresoMateriaPrimaItem> = {};

  // Formulario Modelo de Ingreso Materia Prima
  formMp = {
    producto: 'Ácido Hialurónico Puro 2%',
    codigoInsumo: 'MP-AH-001',
    proveedor: 'Merck KGaA Laboratorios',
    ordenCompra: 'OC-2026-9041',
    paisOrigen: 'Alemania (Darmstadt)',
    loteProveedor: 'LOT-MERCK-8831',
    loteInterno: 'MP-2026-0512',
    cantidadRecibida: 25.5,
    unidades: 'kg',
    precioPorUnidad: 185000,
    fechaRecepcion: '2026-10-20',
    fechaFabricacion: '2026-08-15',
    fechaVencimiento: '2028-08-15',
    aspecto: 'Polvo microcristalino blanco homogéneo',
    colorOlor: 'Inodoro / Blanco puro característico',
    phDensidad: 'pH: 6.45 (solución 1%) / Pureza: 99.2%',
    coaArchivo: 'COA-MERCK-AH-8831.pdf',
    estadoCalidad: 'Aprobado' as 'Aprobado' | 'Cuarentena' | 'Rechazado',
    liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
    temperatura: '20.5 °C',
    humedad: '45 % HR',
    observaciones: 'Empaque trilaminado de aluminio sellado herméticamente al vacío. Certificado de análisis verificado conforme USP.'
  };

  // Formulario de Consumo
  formConsumo = {
    ordenMezcla: 'OM-2026-0042',
    reactor: 'Reactor Principal R-01 (1000L)',
    materiaPrima: 'Ácido Hialurónico Puro 2%',
    loteConsumido: 'MP-2026-0512',
    cantidadDosificada: 12.5,
    unidad: 'kg',
    responsablePesada: 'admin@biotrace.com (Ing. Administrador)'
  };

  // Formulario de Cliente
  formCliente = {
    razonSocial: 'DermoSalud Especializada S.A.S',
    nit: '900.542.118-2',
    contacto: 'Dra. Juliana Martínez',
    correo: 'compras@dermosalud.com',
    telefono: '+57 (601) 840 2200',
    ciudad: 'Bogotá D.C.'
  };

  // Formulario de Producto
  formProducto = {
    codigoGalenico: 'PROD-SERUM-01',
    nombreComercial: 'Sérum Restaurador Hialurónico B5',
    presentacion: 'Frasco Gotero Vidrio Ámbar 30 mL',
    phObjetivo: '5.20 - 5.60',
    densidadObjetivo: '1.025',
    vidaUtilMeses: 24
  };

  // Formulario de Pedido
  formPedido = {
    numeroPedido: 'PED-2026-0812',
    cliente: 'DermoSalud Especializada S.A.S',
    producto: 'Sérum Restaurador Hialurónico B5',
    cantidadUnidades: 500,
    fechaEntregaEstimada: '2026-10-30',
    prioridad: 'ESTÁNDAR'
  };

  // 1. Registros de Ingreso de Materias Primas
  recordsMpIngreso: IngresoMateriaPrimaItem[] = [
    {
      id: '1',
      loteInterno: 'MP-2026-0512',
      producto: 'Ácido Hialurónico Puro 2%',
      codigoInsumo: 'MP-AH-001',
      fechaRecepcion: '2026-10-20',
      proveedor: 'Merck KGaA Laboratorios',
      loteProveedor: 'LOT-MERCK-8831',
      cantidadRecibida: 25.5,
      unidades: 'kg',
      precioPorUnidad: 185000,
      costoTotal: 4717500,
      fechaFabricacion: '2026-08-15',
      fechaVencimiento: '2028-08-15',
      estadoCalidad: 'Aprobado',
      aspecto: 'Polvo microcristalino blanco homogéneo',
      colorOlor: 'Inodoro / Blanco puro característico',
      phDensidad: 'pH: 6.45 (solución 1%) / Pureza: 99.2%',
      coaArchivo: 'COA-MERCK-AH-8831.pdf',
      liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
      observaciones: 'Empaque sellado al vacío en tambor grado farma.'
    },
    {
      id: '2',
      loteInterno: 'MP-2026-0489',
      producto: 'Niacinamida Grado USP 99%',
      codigoInsumo: 'MP-NC-002',
      fechaRecepcion: '2026-10-18',
      proveedor: 'BASF Nutrition & Health',
      loteProveedor: 'LOT-BASF-4410',
      cantidadRecibida: 50.0,
      unidades: 'kg',
      precioPorUnidad: 62000,
      costoTotal: 3100000,
      fechaFabricacion: '2026-07-10',
      fechaVencimiento: '2028-07-10',
      estadoCalidad: 'Aprobado',
      aspecto: 'Polvo cristalino blanco fino',
      colorOlor: 'Inodoro conforme USP',
      phDensidad: 'pH: 6.80 / Pureza: 99.8%',
      coaArchivo: 'COA-BASF-NC-4410.pdf',
      liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
      observaciones: 'Bolsa termosellada intacta.'
    },
    {
      id: '3',
      loteInterno: 'MP-2026-0450',
      producto: 'Glicerina Vegetal USP 99.7%',
      codigoInsumo: 'MP-GV-003',
      fechaRecepcion: '2026-10-15',
      proveedor: 'Croda Personal Care',
      loteProveedor: 'LOT-CR-9082',
      cantidadRecibida: 120.0,
      unidades: 'kg',
      precioPorUnidad: 18500,
      costoTotal: 2220000,
      fechaFabricacion: '2026-06-01',
      fechaVencimiento: '2028-06-01',
      estadoCalidad: 'Aprobado',
      aspecto: 'Líquido viscoso límpido transparente',
      colorOlor: 'Inodoro / Ligeramente dulce',
      phDensidad: 'Densidad: 1.261 g/mL',
      coaArchivo: 'COA-CRODA-GV-9082.pdf',
      liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
      observaciones: 'Tambor de polietileno azul con precinto de seguridad.'
    },
    {
      id: '4',
      loteInterno: 'MP-2026-0411',
      producto: 'Vitamina C Estabilizada (SAP)',
      codigoInsumo: 'MP-VC-004',
      fechaRecepcion: '2026-10-12',
      proveedor: 'Evonik Industries AG',
      loteProveedor: 'LOT-EVK-1120',
      cantidadRecibida: 15.0,
      unidades: 'kg',
      precioPorUnidad: 240000,
      costoTotal: 3600000,
      fechaFabricacion: '2026-08-01',
      fechaVencimiento: '2027-08-01',
      estadoCalidad: 'Cuarentena',
      aspecto: 'Polvo microgranular blanco a blanco cremoso',
      colorOlor: 'Característico suave',
      phDensidad: 'pH: 7.0 (solución al 3%)',
      coaArchivo: 'COA-EVK-VC-1120.pdf',
      liberadoPor: 'Pendiente Análisis HPLC',
      observaciones: 'En proceso de muestreo analítico en laboratorio de control de calidad.'
    },
    {
      id: '5',
      loteInterno: 'MP-2026-0390',
      producto: 'Retinol Liposomado 1.0%',
      codigoInsumo: 'MP-RT-005',
      fechaRecepcion: '2026-10-08',
      proveedor: 'Givaudan Active Beauty',
      loteProveedor: 'LOT-GIV-7761',
      cantidadRecibida: 8.5,
      unidades: 'kg',
      precioPorUnidad: 890000,
      costoTotal: 7565000,
      fechaFabricacion: '2026-09-01',
      fechaVencimiento: '2027-03-01',
      estadoCalidad: 'Aprobado',
      aspecto: 'Dispersión liposómica fluida amarillenta',
      colorOlor: 'Característico suave',
      phDensidad: 'pH: 5.85 / Tamaño partícula < 200 nm',
      coaArchivo: 'COA-GIVAUDAN-RT-7761.pdf',
      liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
      observaciones: 'Almacenar refrigerado entre 2°C y 8°C estrictos.'
    },
    {
      id: '6',
      loteInterno: 'MP-2026-0365',
      producto: 'Extracto Glicólico de Centella Asiática',
      codigoInsumo: 'MP-CA-006',
      fechaRecepcion: '2026-10-02',
      proveedor: 'Indena Pharma Extracts',
      loteProveedor: 'LOT-IND-3209',
      cantidadRecibida: 30.0,
      unidades: 'kg',
      precioPorUnidad: 95000,
      costoTotal: 2850000,
      fechaFabricacion: '2026-05-15',
      fechaVencimiento: '2028-05-15',
      estadoCalidad: 'Aprobado',
      aspecto: 'Líquido translúcido ámbar claro',
      colorOlor: 'Herbal característico',
      phDensidad: 'pH: 5.10 / Densidad: 1.12 g/mL',
      coaArchivo: 'COA-INDENA-CA-3209.pdf',
      liberadoPor: 'admin@biotrace.com (Ing. Administrador)',
      observaciones: 'Bidón opaco protegido de la luz solar.'
    }
  ];

  // 2. Registros de Consumo
  recordsConsumo: ConsumoItem[] = [
    {
      id: 'c1',
      ordenMezcla: 'OM-2026-0042',
      reactor: 'Reactor Principal R-01 (1000L)',
      materiaPrima: 'Ácido Hialurónico Puro 2%',
      loteConsumido: 'MP-2026-0512',
      cantidadDosificada: 10.0,
      unidad: 'kg',
      fechaConsumo: '2026-10-20 08:30',
      responsablePesada: 'admin@biotrace.com',
      estado: 'Dosificado'
    },
    {
      id: 'c2',
      ordenMezcla: 'OM-2026-0042',
      reactor: 'Reactor Principal R-01 (1000L)',
      materiaPrima: 'Glicerina Vegetal USP 99.7%',
      loteConsumido: 'MP-2026-0450',
      cantidadDosificada: 40.0,
      unidad: 'kg',
      fechaConsumo: '2026-10-20 09:15',
      responsablePesada: 'admin@biotrace.com',
      estado: 'Dosificado'
    },
    {
      id: 'c3',
      ordenMezcla: 'OM-2026-0039',
      reactor: 'Reactor Piloto R-02 (250L)',
      materiaPrima: 'Niacinamida Grado USP 99%',
      loteConsumido: 'MP-2026-0489',
      cantidadDosificada: 12.5,
      unidad: 'kg',
      fechaConsumo: '2026-10-19 14:20',
      responsablePesada: 'admin@biotrace.com',
      estado: 'Dosificado'
    }
  ];

  // 3. Registros de Clientes
  recordsClientes: ClienteItem[] = [
    {
      id: 'cl1',
      razonSocial: 'DermoSalud Especializada S.A.S',
      nit: '900.542.118-2',
      contacto: 'Dra. Juliana Martínez',
      correo: 'compras@dermosalud.com',
      telefono: '+57 (601) 840 2200',
      ciudad: 'Bogotá D.C.',
      direccion: 'Carrera 15 # 93-40 Piso 4',
      categoria: 'Clínica Dermatológica',
      estado: 'Activo'
    },
    {
      id: 'cl2',
      razonSocial: 'Farmacias DermoPiel Central Ltda',
      nit: '860.104.992-1',
      contacto: 'Dr. Roberto Gómez',
      correo: 'pedidos@dermopiel.com',
      telefono: '+57 (604) 448 1020',
      ciudad: 'Medellín',
      direccion: 'Calle 10 # 42-28 El Poblado',
      categoria: 'Cadena de Farmacias',
      estado: 'Activo'
    },
    {
      id: 'cl3',
      razonSocial: 'BioCosmetics Lab Distribuidora',
      nit: '901.229.401-8',
      contacto: 'Ing. Carlos Valencia',
      correo: 'operaciones@biocosmetics.com',
      telefono: '+57 (602) 660 8890',
      ciudad: 'Cali',
      direccion: 'Avenida 6N # 24N-10',
      categoria: 'Distribuidor Mayorista',
      estado: 'Activo'
    }
  ];

  // 4. Registros de Productos
  recordsProductos: ProductoItem[] = [
    {
      id: 'pr1',
      codigoGalenico: 'PROD-SERUM-01',
      nombreComercial: 'Sérum Restaurador Hialurónico B5',
      presentacion: 'Frasco Gotero Vidrio Ámbar 30 mL',
      phObjetivo: '5.20 - 5.60',
      densidadObjetivo: '1.025',
      vidaUtilMeses: 24,
      registroSanitario: 'NSOC98124-21CO',
      estado: 'Aprobado'
    },
    {
      id: 'pr2',
      codigoGalenico: 'PROD-GEL-02',
      nombreComercial: 'Gel Hidratante Niacinamida 10% + Zinc',
      presentacion: 'Pomo Airless 50 g',
      phObjetivo: '5.80 - 6.20',
      densidadObjetivo: '1.010',
      vidaUtilMeses: 24,
      registroSanitario: 'NSOC99401-22CO',
      estado: 'Aprobado'
    },
    {
      id: 'pr3',
      codigoGalenico: 'PROD-CREM-03',
      nombreComercial: 'Crema Reparadora de Barrera Ceramidas',
      presentacion: 'Tubo Laminado 60 g',
      phObjetivo: '5.50 - 6.00',
      densidadObjetivo: '0.985',
      vidaUtilMeses: 36,
      registroSanitario: 'NSOC88210-20CO',
      estado: 'Aprobado'
    }
  ];

  // 5. Registros de Pedidos
  recordsPedidos: PedidoItem[] = [
    {
      id: 'ped1',
      numeroPedido: 'PED-2026-0812',
      cliente: 'DermoSalud Especializada S.A.S',
      producto: 'Sérum Restaurador Hialurónico B5',
      cantidadUnidades: 500,
      fechaOrden: '2026-10-18',
      fechaEntregaEstimada: '2026-10-25',
      prioridad: 'ALTA',
      estado: 'En Preparación'
    },
    {
      id: 'ped2',
      numeroPedido: 'PED-2026-0809',
      cliente: 'Farmacias DermoPiel Central Ltda',
      producto: 'Gel Hidratante Niacinamida 10% + Zinc',
      cantidadUnidades: 1200,
      fechaOrden: '2026-10-16',
      fechaEntregaEstimada: '2026-10-28',
      prioridad: 'ESTÁNDAR',
      estado: 'Aprobado'
    }
  ];

  currentStation = computed<StationMetadata | null>(() => {
    const mod = this.ui.activeModule();
    if (mod === 'inicio') return null;
    return STATIONS_INFO[mod] || null;
  });

  currentRecordsCount = computed<number>(() => {
    const mod = this.ui.activeModule();
    if (mod === 'mp-ingreso') return this.recordsMpIngreso.length;
    if (mod === 'mp-consumo') return this.recordsConsumo.length;
    if (mod === 'clientes') return this.recordsClientes.length;
    if (mod === 'productos') return this.recordsProductos.length;
    if (mod === 'pedidos') return this.recordsPedidos.length;
    return 1;
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

  // Filtrado reactivo de materias primas
  filteredMpIngresos(): IngresoMateriaPrimaItem[] {
    return this.recordsMpIngreso.filter((reg) => {
      if (this.filtroEstado !== 'TODOS' && reg.estadoCalidad !== this.filtroEstado) {
        return false;
      }
      if (this.filtroFecha && (!reg.fechaRecepcion || !reg.fechaRecepcion.startsWith(this.filtroFecha))) {
        return false;
      }
      if (!this.searchTerm) return true;
      const s = this.searchTerm.toLowerCase().trim();
      return (
        reg.producto.toLowerCase().includes(s) ||
        reg.proveedor.toLowerCase().includes(s) ||
        reg.loteProveedor.toLowerCase().includes(s) ||
        reg.loteInterno.toLowerCase().includes(s) ||
        reg.codigoInsumo.toLowerCase().includes(s)
      );
    });
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroEstado = 'TODOS';
    this.filtroFecha = '';
  }

  // Guardado de Materia Prima
  guardarIngresoMP() {
    if (!this.formMp.producto || !this.formMp.loteInterno) return;

    const cant = Number(this.formMp.cantidadRecibida) || 0;
    const precio = Number(this.formMp.precioPorUnidad) || 0;
    const nuevo: IngresoMateriaPrimaItem = {
      id: Date.now().toString(),
      loteInterno: this.formMp.loteInterno.trim(),
      producto: this.formMp.producto.trim(),
      codigoInsumo: this.formMp.codigoInsumo.trim(),
      fechaRecepcion: this.formMp.fechaRecepcion,
      proveedor: this.formMp.proveedor,
      loteProveedor: this.formMp.loteProveedor.trim(),
      cantidadRecibida: cant,
      unidades: this.formMp.unidades,
      precioPorUnidad: precio,
      costoTotal: cant * precio,
      fechaFabricacion: this.formMp.fechaFabricacion,
      fechaVencimiento: this.formMp.fechaVencimiento,
      estadoCalidad: this.formMp.estadoCalidad,
      aspecto: this.formMp.aspecto,
      colorOlor: this.formMp.colorOlor,
      phDensidad: this.formMp.phDensidad,
      coaArchivo: this.formMp.coaArchivo,
      liberadoPor: this.formMp.liberadoPor,
      observaciones: this.formMp.observaciones
    };

    this.recordsMpIngreso.unshift(nuevo);
    this.feedbackMessage.set(`¡Lote ${nuevo.loteInterno} (${nuevo.producto}) registrado con éxito en el sistema GMP!`);
    
    // Auto-ocultar feedback tras 4 segundos
    setTimeout(() => this.feedbackMessage.set(null), 4000);

    // Cambiar a vista de registros para ver el ítem ingresado
    this.setTab('list');
  }

  resetFormMp() {
    this.formMp.producto = '';
    this.formMp.loteProveedor = '';
    this.formMp.loteInterno = 'MP-2026-' + Math.floor(1000 + Math.random() * 9000);
    this.formMp.cantidadRecibida = 10;
    this.formMp.precioPorUnidad = 50000;
  }

  // Guardado de Consumo
  guardarConsumoMP() {
    const nuevo: ConsumoItem = {
      id: Date.now().toString(),
      ordenMezcla: this.formConsumo.ordenMezcla,
      reactor: this.formConsumo.reactor,
      materiaPrima: this.formConsumo.materiaPrima,
      loteConsumido: this.formConsumo.loteConsumido,
      cantidadDosificada: Number(this.formConsumo.cantidadDosificada) || 0,
      unidad: this.formConsumo.unidad,
      fechaConsumo: new Date().toISOString().replace('T', ' ').substring(0, 16),
      responsablePesada: this.formConsumo.responsablePesada,
      estado: 'Dosificado'
    };

    this.recordsConsumo.unshift(nuevo);
    this.feedbackMessage.set(`¡Consumo de ${nuevo.cantidadDosificada} ${nuevo.unidad} para la orden ${nuevo.ordenMezcla} registrado!`);
    setTimeout(() => this.feedbackMessage.set(null), 4000);
    this.setTab('list');
  }

  // Guardado de Cliente
  guardarCliente() {
    const nuevo: ClienteItem = {
      id: Date.now().toString(),
      razonSocial: this.formCliente.razonSocial,
      nit: this.formCliente.nit,
      contacto: this.formCliente.contacto,
      correo: this.formCliente.correo,
      telefono: this.formCliente.telefono,
      ciudad: this.formCliente.ciudad,
      direccion: 'Sede Principal',
      categoria: 'Cliente Homologado',
      estado: 'Activo'
    };

    this.recordsClientes.unshift(nuevo);
    this.feedbackMessage.set(`¡Cliente ${nuevo.razonSocial} homologado y registrado!`);
    setTimeout(() => this.feedbackMessage.set(null), 4000);
    this.setTab('list');
  }

  // Guardado de Producto
  guardarProducto() {
    const nuevo: ProductoItem = {
      id: Date.now().toString(),
      codigoGalenico: this.formProducto.codigoGalenico,
      nombreComercial: this.formProducto.nombreComercial,
      presentacion: this.formProducto.presentacion,
      phObjetivo: this.formProducto.phObjetivo,
      densidadObjetivo: this.formProducto.densidadObjetivo,
      vidaUtilMeses: this.formProducto.vidaUtilMeses,
      registroSanitario: 'NSOC-2026-TRAMITE',
      estado: 'Aprobado'
    };

    this.recordsProductos.unshift(nuevo);
    this.feedbackMessage.set(`¡Producto ${nuevo.nombreComercial} incorporado al catálogo oficial!`);
    setTimeout(() => this.feedbackMessage.set(null), 4000);
    this.setTab('list');
  }

  // Guardado de Pedido
  guardarPedido() {
    const nuevo: PedidoItem = {
      id: Date.now().toString(),
      numeroPedido: this.formPedido.numeroPedido,
      cliente: this.formPedido.cliente,
      producto: this.formPedido.producto,
      cantidadUnidades: Number(this.formPedido.cantidadUnidades) || 100,
      fechaOrden: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: this.formPedido.fechaEntregaEstimada,
      prioridad: this.formPedido.prioridad,
      estado: 'En Preparación'
    };

    this.recordsPedidos.unshift(nuevo);
    this.feedbackMessage.set(`¡Orden de Pedido ${nuevo.numeroPedido} generada exitosamente!`);
    setTimeout(() => this.feedbackMessage.set(null), 4000);
    this.setTab('list');
  }

  // Acciones de Modales
  openDetailModal(item: IngresoMateriaPrimaItem) {
    this.selectedDetailItem = item;
  }

  closeDetailModal() {
    this.selectedDetailItem = null;
  }

  openEditModal(item: IngresoMateriaPrimaItem) {
    this.selectedEditItem = item;
    this.editForm = { ...item };
  }

  closeEditModal() {
    this.selectedEditItem = null;
    this.editForm = {};
  }

  guardarEdicion() {
    if (!this.selectedEditItem) return;
    const idx = this.recordsMpIngreso.findIndex(r => r.id === this.selectedEditItem!.id);
    if (idx !== -1) {
      const cant = Number(this.editForm.cantidadRecibida) || this.recordsMpIngreso[idx].cantidadRecibida;
      const precio = Number(this.editForm.precioPorUnidad) || this.recordsMpIngreso[idx].precioPorUnidad;
      this.recordsMpIngreso[idx] = {
        ...this.recordsMpIngreso[idx],
        ...this.editForm,
        cantidadRecibida: cant,
        precioPorUnidad: precio,
        costoTotal: cant * precio
      } as IngresoMateriaPrimaItem;
      this.feedbackMessage.set(`¡Lote ${this.recordsMpIngreso[idx].loteInterno} actualizado correctamente!`);
      setTimeout(() => this.feedbackMessage.set(null), 4000);
    }
    this.closeEditModal();
  }

  eliminarIngreso(item: IngresoMateriaPrimaItem) {
    if (confirm(`¿Confirma eliminar el registro del lote ${item.loteInterno} (${item.producto})?`)) {
      this.recordsMpIngreso = this.recordsMpIngreso.filter(r => r.id !== item.id);
      this.feedbackMessage.set(`Registro del lote ${item.loteInterno} eliminado.`);
      setTimeout(() => this.feedbackMessage.set(null), 4000);
    }
  }
}
