export interface ProductRecord { id: string; codigo_unico: string; nombre_producto: string; presentaciones: string | null; }
export interface MaterialRecord { id: string; codigo_materia_prima: string; nombre_insumo: string; unidad_medida: string; }
export interface ClientRecord { id: string; nombre_empresa: string; persona_contacto: string; email: string; telefono: string; direccion: string | null; }
export interface InventoryRecord { id: string; materia_prima_id: string; lote_interno: string; stock_disponible: string; materia_prima: MaterialRecord; }
export interface ReceiptRecord { id: string; proveedor: string; lote_proveedor: string; cantidad_recibida: string; fecha_ingreso: string; inventario: InventoryRecord; materia_prima: MaterialRecord; }
export interface OrderRecord { id: string; numero_pedido: string; estado: string; fecha_pedido: string; cliente: ClientRecord; detalles: { nombre_producto: string; cantidad: number }[]; }
export interface ProductionRecord { id: string; lote: string; producto_id: string; nombre_producto: string; cantidad_programada: string; }
export interface LotRecord { id: string; orden_id: string; total_unidades: string; orden: ProductionRecord; }
export interface ConsumptionRecord { id: string; unidad_lote: string; fecha_consumo: string; orden: ProductionRecord; detalles: { peso_real_consumido: string; inventario: InventoryRecord; materia_prima: MaterialRecord }[]; }
export interface QualityRecord { id:string; orden_id:string; muestra_aprobada:boolean; analizado_por:string; revisado_por:string; orden:ProductionRecord; parametros:{parametro:string;especificacion:string;resultado:string;cumple:boolean}[]; }
