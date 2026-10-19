# Guía Ejecutiva de Agentes & Estándares del Proyecto

Este documento resume las reglas indispensables, directrices de diseño y arquitectura de **BioTrace (Proyecto Trazabilidad)** para las ramas `front-back` y `main`. La documentación técnica exhaustiva se encuentra en [AGENTS.md](file:///c:/Users/masterdent-soft/Downloads/Proyecto-Trazabilidad/AGENTS.md).

---

## 🎨 1. Reglas Visuales & Colores Obligatorios

- **Paleta Oficial**: **Titanio Profundo & Cian Glacial**
  - Titanio oscuro: `#0f172a`, `#1e293b`, `#090d16`
  - Cian Glacial: `#0891b2`, `#06b6d4`, `#ecfeff`
  - Fondos técnicos: `#ffffff`, `#f8fafc`, `#f1f5f9`
- ⛔ **PROHIBICIÓN ESTRICTA**: **CERO ROJO Y CERO AMARILLO** bajo ninguna circunstancia. Para alertas, estados de rechazo o inactividad se utiliza titanio oscuro, gris pizarra técnico o acentos cian.

---

## 🏭 2. Dominio y Alcance

- **Exclusivo**: Cosméticos, Dermocosmética y Farmacéutica (*BioTrace*).
- ⛔ **PROHIBIDO**: Menciones o módulos de alimentos/bebidas (tienen normativas independientes).
- **Módulos Core**:
  1. Principios Activos & Excipientes (Recepción y Pureza).
  2. Proveedores & Laboratorios Homologados.
  3. Órdenes de Formulación & Mezcla en Reactores.
  4. Lotes de Producto Terminado & Liberación GMP (`PENDING`, `APPROVED`, `REJECTED`).
  5. Árbol Genealógico 360° (Trazabilidad Ascendente y Descendente).
  6. Despachos y Movimientos de Inventario (`IN`, `OUT`).

---

## 🔒 3. Seguridad & Autenticación JWT (30 Minutos)

- **Expiración de Token**: JWT firmado con validez de **30 minutos**.
- **Control de Inactividad**: El cliente monitorea interacción del usuario (`mousemove`, `keydown`, `click`, etc.). Si pasan **30 minutos sin actividad**, se cierra la sesión automáticamente (`logout()`).
- **Uso Continuo**: Si el usuario sigue activo, el temporizador se reinicia a `30:00` y el token se renueva en segundo plano (`POST /api/auth/refresh`).
- **Visualizador en Vivo**: El navbar cuenta con una píldora que muestra el tiempo restante en vivo (ej. `29:58 min`).

---

## 📐 4. Diagramación con CSS Grid Responsive

- Todas las interfaces deben emplear **CSS Grid** (`display: grid`, `grid-template-columns`, `gap`) para compatibilidad fluida en teléfonos, tablets y computadores.
- Tarjetas equilibradas y a la medida, sin espacios vacíos innecesarios.

---

## 🚀 5. Comandos de Inicio Rápido

Solo se requieren dos comandos directos (sin Docker):
1. **Backend**: `cd backend && npm run dev` (API en `http://localhost:3000/api`)
2. **Frontend**: `cd frontend && npm run dev` (Cliente en `http://localhost:4200`)
