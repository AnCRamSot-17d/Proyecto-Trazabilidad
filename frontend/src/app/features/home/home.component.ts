import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      
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
            <span class="metric-label">SISTEMA VISUAL & GRID</span>
            <span class="metric-value">CSS Grid Responsive (Multi-dispositivo)</span>
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
            <p class="section-subtitle">Arquitectura modular limpia lista para operar y expandir</p>
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
            <p>Catálogo de materias primas con código CAS, concentraciones, unidades de medida y recepción de lotes de insumos con fecha de ingreso y proveedor de origen.</p>
            <div class="module-foot">
              <span class="foot-highlight">Rastreo de pureza y stock disponible</span>
            </div>
          </div>

          <!-- Módulo 2 -->
          <div class="card module-box">
            <div class="module-top">
              <span class="module-tag">HOMOLOGACIÓN</span>
              <span class="module-code">MOD-02</span>
            </div>
            <h3>Laboratorios & Proveedores</h3>
            <p>Directorio de proveedores calificados de materias primas, gestión de contactos, certificados de análisis y trazabilidad por casa fabricante.</p>
            <div class="module-foot">
              <span class="foot-highlight">Calificación de proveedores aprobados</span>
            </div>
          </div>

          <!-- Módulo 3 -->
          <div class="card module-box">
            <div class="module-top">
              <span class="module-tag">MANUFACTURA</span>
              <span class="module-code">MOD-03</span>
            </div>
            <h3>Órdenes de Formulación & Mezcla</h3>
            <p>Programación de reactores y líneas de llenado con balance estricto de consumos: la suma de insumos consumidos se valida atómicamente contra el inventario físico.</p>
            <div class="module-foot">
              <span class="foot-highlight">Balance de masa sin desviaciones</span>
            </div>
          </div>

          <!-- Módulo 4 -->
          <div class="card module-box">
            <div class="module-top">
              <span class="module-tag">ASEGURAMIENTO</span>
              <span class="module-code">MOD-04</span>
            </div>
            <h3>Lotes Terminados & Calidad</h3>
            <p>Registro de lotes de cosméticos y fármacos terminados, control de cuarentena y dictamen técnico de liberación de calidad (APPROVED / REJECTED).</p>
            <div class="module-foot">
              <span class="foot-highlight">Liberación oficial para despacho</span>
            </div>
          </div>

          <!-- Módulo 5 (Estrella) -->
          <div class="card module-box highlight-box">
            <div class="module-top">
              <span class="module-tag tag-cyan">AUDITORÍA TOTAL</span>
              <span class="module-code code-cyan">MOD-360°</span>
            </div>
            <h3>Árbol Genealógico de Trazabilidad 360°</h3>
            <p>Rastreo genealógico bidireccional instantáneo: dado un producto terminado, inspecciona cada miligramo de principio activo; o dado un lote de insumo, encuentra cada frasco donde fue aplicado.</p>
            <div class="module-foot">
              <span class="foot-cyan">Inspección ascendente y descendente</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
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
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 1.75rem;
    }
    .metric-item {
      display: flex;
      flex-direction: column;
    }
    .metric-label {
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 0.4rem;
    }
    .metric-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }
    .metric-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: #0891b2;
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
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin-bottom: 0.25rem;
    }
    .section-subtitle {
      font-size: 0.95rem;
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
      padding: 1.85rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
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
    .foot-highlight {
      color: #0891b2;
      font-weight: 600;
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
    .foot-cyan {
      color: #0891b2;
      font-weight: 700;
    }
  `],
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  isOnline = signal<boolean>(false);

  ngOnInit() {
    this.api.getHealth().subscribe({
      next: (res) => this.isOnline.set(res.status === 'ok'),
      error: () => this.isOnline.set(false),
    });
  }
}
