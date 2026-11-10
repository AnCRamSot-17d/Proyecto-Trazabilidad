import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('--- Iniciando Sembrado Completo en Neon PostgreSQL ---');

  // Limpiar tablas en orden para evitar violaciones de clave foránea
  console.log('1. Limpiando datos previos si existen...');
  await prisma.parametroCalidad.deleteMany();
  await prisma.registroControlCalidad.deleteMany();
  await prisma.pasoFabricacion.deleteMany();
  await prisma.registroFabricacion.deleteMany();
  await prisma.registroDispensacion.deleteMany();
  await prisma.registroEnvasado.deleteMany();
  await prisma.registroAcondicionamientoEtiquetado.deleteMany();
  await prisma.registroAcondicionamientoLoteo.deleteMany();
  await prisma.detalleConsumoMateriaPrima.deleteMany();
  await prisma.consumoMateriaPrima.deleteMany();
  await prisma.ingresoMateriaPrima.deleteMany();
  await prisma.inventarioMateriaPrima.deleteMany();
  await prisma.productoMateriaPrima.deleteMany();
  await prisma.ordenProduccion.deleteMany();
  await prisma.detallePedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.materiaPrima.deleteMany();
  await prisma.cliente.deleteMany();

  // 2. CLIENTES
  console.log('2. Insertando Clientes...');
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre_empresa: 'Dermocosmética San Ángel S.A.S.',
      persona_contacto: 'Dr. Roberto Gómez (Director Compras)',
      email: 'compras@dermosanangel.com',
      telefono: '+57 (4) 448-9210',
      direccion: 'Cra 43A # 18 Sur - 125, El Poblado, Medellín'
    }
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre_empresa: 'Distribuidora Belleza & Salud Farma S.A.',
      persona_contacto: 'Lic. Camila Ortiz (Jefe Abastecimiento)',
      email: 'cortiz@bellezaysaludfarma.co',
      telefono: '+57 (1) 745-3300',
      direccion: 'Av. Calle 26 # 69D - 91, Salitre, Bogotá'
    }
  });

  const cliente3 = await prisma.cliente.create({
    data: {
      nombre_empresa: 'Laboratorios DermaPiel Ltda.',
      persona_contacto: 'Dr. Andrés Cárdenas (Regente Farmacia)',
      email: 'direcciontecnica@dermapiel.com.co',
      telefono: '+57 (2) 660-8420',
      direccion: 'Calle 10 # 32 - 45, San Fernando, Cali'
    }
  });

  // 3. MATERIAS PRIMAS
  console.log('3. Insertando Materias Primas...');
  const mpHA = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-HA-01',
      nombre_insumo: 'Ácido Hialurónico Puro 99% (Sodio Hialuronato)',
      unidad_medida: 'Kg'
    }
  });

  const mpAG = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-AG-02',
      nombre_insumo: 'Agua Desionizada Purificada Grado USP',
      unidad_medida: 'Kg'
    }
  });

  const mpGL = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-GL-03',
      nombre_insumo: 'Glicerina Vegetal USP 99.5%',
      unidad_medida: 'Kg'
    }
  });

  const mpCR = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-CR-04',
      nombre_insumo: 'Complejo Ceramidas Lipídicas (EOP, NP, AP)',
      unidad_medida: 'Kg'
    }
  });

  const mpMK = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-MK-05',
      nombre_insumo: 'Manteca de Karité Refinada Grado Cosmético',
      unidad_medida: 'Kg'
    }
  });

  const mpHB = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-HB-06',
      nombre_insumo: 'Extracto Botánico de Hamamelis y Caléndula',
      unidad_medida: 'Kg'
    }
  });

  const mpNI = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-NI-07',
      nombre_insumo: 'Niacinamida Pura USP (Vitamina B3)',
      unidad_medida: 'Kg'
    }
  });

  const mpCOL = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-COL-08',
      nombre_insumo: 'Colágeno Marino Hidrolizado USP',
      unidad_medida: 'Kg'
    }
  });

  const mpVIT = await prisma.materiaPrima.create({
    data: {
      codigo_materia_prima: 'MP-VIT-09',
      nombre_insumo: 'Vitamina E Acetato Grado USP (Tocoferol)',
      unidad_medida: 'Kg'
    }
  });

  // 4. INVENTARIOS & INGRESOS DE MATERIA PRIMA
  console.log('4. Insertando Lotes de Inventario e Ingresos...');

  // Lote 1: Acido Hialuronico (25 recibido, 3 consumido -> 22 saldo)
  const invHA = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpHA.id,
      lote_interno: 'LOT-MP-HA-101',
      stock_disponible: new Prisma.Decimal('22.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpHA.id,
      inventario_id: invHA.id,
      lote_proveedor: 'HA-EU-884',
      cantidad_recibida: new Prisma.Decimal('25.0000'),
      proveedor: 'Solchem Biochem International',
      fecha_ingreso: new Date('2026-04-18')
    }
  });

  // Lote 2: Ceramidas (50 recibido, 4.5 consumido -> 45.5 saldo)
  const invCR = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpCR.id,
      lote_interno: 'LOT-MP-CR-404',
      stock_disponible: new Prisma.Decimal('45.5000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpCR.id,
      inventario_id: invCR.id,
      lote_proveedor: 'CR-GER-512',
      cantidad_recibida: new Prisma.Decimal('50.0000'),
      proveedor: 'Evonik Pharma Specialties',
      fecha_ingreso: new Date('2026-04-20')
    }
  });

  // Lote 3: Hamamelis (40 recibido, 10 consumido -> 30 saldo)
  const invHB = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpHB.id,
      lote_interno: 'LOT-MP-HA-606',
      stock_disponible: new Prisma.Decimal('30.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpHB.id,
      inventario_id: invHB.id,
      lote_proveedor: 'HB-COL-230',
      cantidad_recibida: new Prisma.Decimal('40.0000'),
      proveedor: 'Fitobotanica Lab Colombia',
      fecha_ingreso: new Date('2026-04-22')
    }
  });

  // Lote 4: Agua Desionizada (1000 recibido, 359 consumido -> 641 saldo)
  const invAG = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpAG.id,
      lote_interno: 'LOT-MP-AG-205',
      stock_disponible: new Prisma.Decimal('641.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpAG.id,
      inventario_id: invAG.id,
      lote_proveedor: 'AG-MED-205',
      cantidad_recibida: new Prisma.Decimal('1000.0000'),
      proveedor: 'Acuabio Planta Central',
      fecha_ingreso: new Date('2026-05-01')
    }
  });

  // Lote 5: Glicerina (200 recibido, 4.5 consumido -> 195.5 saldo)
  const invGL = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpGL.id,
      lote_interno: 'LOT-MP-GL-302',
      stock_disponible: new Prisma.Decimal('195.5000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpGL.id,
      inventario_id: invGL.id,
      lote_proveedor: 'GL-USP-991',
      cantidad_recibida: new Prisma.Decimal('200.0000'),
      proveedor: 'Glicerol Chem S.A.S.',
      fecha_ingreso: new Date('2026-04-25')
    }
  });

  // Lote 6: Niacinamida (5 recibido, 4 consumido -> 1 saldo: BAJO STOCK 20%)
  const invNI = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpNI.id,
      lote_interno: 'LOT-MP-NI-707',
      stock_disponible: new Prisma.Decimal('1.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpNI.id,
      inventario_id: invNI.id,
      lote_proveedor: 'NI-CH-774',
      cantidad_recibida: new Prisma.Decimal('5.0000'),
      proveedor: 'Lonza Specialties Inc.',
      fecha_ingreso: new Date('2026-05-02')
    }
  });

  // Lote 7: Karité (18 recibido, 15 consumido -> 3 saldo: BAJO STOCK 16.6%)
  const invMK = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpMK.id,
      lote_interno: 'LOT-MP-MK-505',
      stock_disponible: new Prisma.Decimal('3.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpMK.id,
      inventario_id: invMK.id,
      lote_proveedor: 'MK-SWE-220',
      cantidad_recibida: new Prisma.Decimal('18.0000'),
      proveedor: 'AarhusKarlshamn (AAK) Sweden',
      fecha_ingreso: new Date('2026-04-28')
    }
  });

  // Lote 8: Colageno (10 recibido, 10 consumido -> 0 saldo: AGOTADO)
  const invCOL = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpCOL.id,
      lote_interno: 'LOT-MP-COL-101',
      stock_disponible: new Prisma.Decimal('0.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpCOL.id,
      inventario_id: invCOL.id,
      lote_proveedor: 'COL-FR-110',
      cantidad_recibida: new Prisma.Decimal('10.0000'),
      proveedor: 'Rousselot Peptan France',
      fecha_ingreso: new Date('2026-04-10')
    }
  });

  // Lote 9: Vitamina E (2 recibido, 2 consumido -> 0 saldo: AGOTADO)
  const invVIT = await prisma.inventarioMateriaPrima.create({
    data: {
      materia_prima_id: mpVIT.id,
      lote_interno: 'LOT-MP-VIT-808',
      stock_disponible: new Prisma.Decimal('0.0000')
    }
  });
  await prisma.ingresoMateriaPrima.create({
    data: {
      materia_prima_id: mpVIT.id,
      inventario_id: invVIT.id,
      lote_proveedor: 'DSM-VIT-808',
      cantidad_recibida: new Prisma.Decimal('2.0000'),
      proveedor: 'DSM Nutritional Products',
      fecha_ingreso: new Date('2026-04-12')
    }
  });

  // 5. PRODUCTOS Y FÓRMULAS MAESTRAS
  console.log('5. Insertando Productos y Fórmulas...');
  const prod1 = await prisma.producto.create({
    data: {
      cliente_id: cliente1.id,
      codigo_unico: 'PRD-SER-01',
      nombre_producto: 'Sérum Facial Ácido Hialurónico 2%',
      presentaciones: 'Frasco gotero de vidrio ámbar x 30 ml'
    }
  });
  await prisma.productoMateriaPrima.createMany({
    data: [
      { producto_id: prod1.id, materia_prima_id: mpHA.id, porcentaje_o_proporcion: new Prisma.Decimal('0.0200') },
      { producto_id: prod1.id, materia_prima_id: mpAG.id, porcentaje_o_proporcion: new Prisma.Decimal('0.9500') },
      { producto_id: prod1.id, materia_prima_id: mpGL.id, porcentaje_o_proporcion: new Prisma.Decimal('0.0300') }
    ]
  });

  const prod2 = await prisma.producto.create({
    data: {
      cliente_id: cliente2.id,
      codigo_unico: 'PRD-CRM-02',
      nombre_producto: 'Crema Hidratante Ceramid-5 Ultra',
      presentaciones: 'Pote cosmético sellado al vacío x 50 g'
    }
  });
  await prisma.productoMateriaPrima.createMany({
    data: [
      { producto_id: prod2.id, materia_prima_id: mpCR.id, porcentaje_o_proporcion: new Prisma.Decimal('0.0300') },
      { producto_id: prod2.id, materia_prima_id: mpMK.id, porcentaje_o_proporcion: new Prisma.Decimal('0.1000') },
      { producto_id: prod2.id, materia_prima_id: mpAG.id, porcentaje_o_proporcion: new Prisma.Decimal('0.8700') }
    ]
  });

  const prod3 = await prisma.producto.create({
    data: {
      cliente_id: cliente3.id,
      codigo_unico: 'PRD-TON-03',
      nombre_producto: 'Tónico Facial Botánico Calmante',
      presentaciones: 'Frasco pulverizador con atomizador x 200 ml'
    }
  });
  await prisma.productoMateriaPrima.createMany({
    data: [
      { producto_id: prod3.id, materia_prima_id: mpHB.id, porcentaje_o_proporcion: new Prisma.Decimal('0.1000') },
      { producto_id: prod3.id, materia_prima_id: mpNI.id, porcentaje_o_proporcion: new Prisma.Decimal('0.0400') },
      { producto_id: prod3.id, materia_prima_id: mpAG.id, porcentaje_o_proporcion: new Prisma.Decimal('0.8600') }
    ]
  });

  // 6. PEDIDOS Y DETALLES DE PEDIDO
  console.log('6. Insertando Pedidos Comerciales...');
  const ped1 = await prisma.pedido.create({
    data: {
      numero_pedido: 'PED-2026-001',
      cliente_id: cliente1.id,
      estado: 'DESPACHADO',
      fecha_pedido: new Date('2026-05-02'),
      detalles: {
        create: [
          {
            nombre_producto: 'Sérum Facial Ácido Hialurónico 2%',
            presentacion: 'Frasco gotero de vidrio ámbar x 30 ml',
            cantidad: 5000,
            precio_unitario: new Prisma.Decimal('28500.00'),
            subtotal: new Prisma.Decimal('142500000.00')
          }
        ]
      }
    }
  });

  const ped2 = await prisma.pedido.create({
    data: {
      numero_pedido: 'PED-2026-002',
      cliente_id: cliente2.id,
      estado: 'DESPACHADO',
      fecha_pedido: new Date('2026-05-03'),
      detalles: {
        create: [
          {
            nombre_producto: 'Crema Hidratante Ceramid-5 Ultra',
            presentacion: 'Pote cosmético sellado al vacío x 50 g',
            cantidad: 3000,
            precio_unitario: new Prisma.Decimal('34000.00'),
            subtotal: new Prisma.Decimal('102000000.00')
          }
        ]
      }
    }
  });

  const ped3 = await prisma.pedido.create({
    data: {
      numero_pedido: 'PED-2026-003',
      cliente_id: cliente3.id,
      estado: 'LISTO_PARA_DESPACHO',
      fecha_pedido: new Date('2026-05-05'),
      detalles: {
        create: [
          {
            nombre_producto: 'Tónico Facial Botánico Calmante',
            presentacion: 'Frasco pulverizador con atomizador x 200 ml',
            cantidad: 2000,
            precio_unitario: new Prisma.Decimal('19500.00'),
            subtotal: new Prisma.Decimal('39000000.00')
          }
        ]
      }
    }
  });

  // 7. ÓRDENES DE PRODUCCIÓN
  console.log('7. Insertando Órdenes de Producción...');
  const op1 = await prisma.ordenProduccion.create({
    data: {
      pedido_id: ped1.id,
      producto_id: prod1.id,
      lote: 'LOT-SH-2026-001',
      nombre_producto: 'Sérum Facial Ácido Hialurónico 2%',
      nombre_fantasia: 'BioTrace Derma Care Pure HA',
      marca: 'BioTrace Derma Care',
      cantidad_programada: new Prisma.Decimal('150.0000'),
      presentacion: 'Frasco gotero x 30 ml',
      notificacion_sanitaria: 'NSOC94210-26CO',
      estado_general: 'COMPLETADO'
    }
  });

  const op2 = await prisma.ordenProduccion.create({
    data: {
      pedido_id: ped2.id,
      producto_id: prod2.id,
      lote: 'LOT-CR-2026-015',
      nombre_producto: 'Crema Hidratante Ceramid-5 Ultra',
      nombre_fantasia: 'BioTrace Barrier Repair Cream',
      marca: 'BioTrace Barrier Repair',
      cantidad_programada: new Prisma.Decimal('150.0000'),
      presentacion: 'Pote cosmético x 50 g',
      notificacion_sanitaria: 'NSOC88124-25CO',
      estado_general: 'COMPLETADO'
    }
  });

  const op3 = await prisma.ordenProduccion.create({
    data: {
      pedido_id: ped3.id,
      producto_id: prod3.id,
      lote: 'LOT-TG-2026-042',
      nombre_producto: 'Tónico Facial Botánico Calmante',
      nombre_fantasia: 'BioTrace Botanical Facial Mist',
      marca: 'BioTrace Natural Solutions',
      cantidad_programada: new Prisma.Decimal('100.0000'),
      presentacion: 'Frasco pulverizador x 200 ml',
      notificacion_sanitaria: 'NSOC76319-24CO',
      estado_general: 'COMPLETADO'
    }
  });

  // 8. CONSUMOS DE MATERIA PRIMA (DETALLES VINCULADOS A INVENTARIO)
  console.log('8. Insertando Consumos de Materia Prima y Balance...');
  await prisma.consumoMateriaPrima.create({
    data: {
      orden_id: op1.id,
      lote_total_fabricar: new Prisma.Decimal('150.0000'),
      unidad_lote: 'Kg',
      codigo_balanza: 'Balanza Analítica Mettler Toledo (Calib #04)',
      fecha_consumo: new Date('2026-05-06'),
      total_programado: new Prisma.Decimal('150.0000'),
      total_real_consumido: new Prisma.Decimal('150.0000'),
      variacion_diferencia: new Prisma.Decimal('0.0000'),
      detalles: {
        create: [
          { materia_prima_id: mpHA.id, inventario_id: invHA.id, cantidad_programada: new Prisma.Decimal('3.0000'), peso_real_consumido: new Prisma.Decimal('3.0000') },
          { materia_prima_id: mpAG.id, inventario_id: invAG.id, cantidad_programada: new Prisma.Decimal('142.5000'), peso_real_consumido: new Prisma.Decimal('142.5000') },
          { materia_prima_id: mpGL.id, inventario_id: invGL.id, cantidad_programada: new Prisma.Decimal('4.5000'), peso_real_consumido: new Prisma.Decimal('4.5000') }
        ]
      }
    }
  });

  await prisma.consumoMateriaPrima.create({
    data: {
      orden_id: op2.id,
      lote_total_fabricar: new Prisma.Decimal('150.0000'),
      unidad_lote: 'Kg',
      codigo_balanza: 'Balanza Analítica Mettler Toledo',
      fecha_consumo: new Date('2026-05-07'),
      total_programado: new Prisma.Decimal('150.0000'),
      total_real_consumido: new Prisma.Decimal('150.0000'),
      variacion_diferencia: new Prisma.Decimal('0.0000'),
      detalles: {
        create: [
          { materia_prima_id: mpCR.id, inventario_id: invCR.id, cantidad_programada: new Prisma.Decimal('4.5000'), peso_real_consumido: new Prisma.Decimal('4.5000') },
          { materia_prima_id: mpMK.id, inventario_id: invMK.id, cantidad_programada: new Prisma.Decimal('15.0000'), peso_real_consumido: new Prisma.Decimal('15.0000') },
          { materia_prima_id: mpAG.id, inventario_id: invAG.id, cantidad_programada: new Prisma.Decimal('130.5000'), peso_real_consumido: new Prisma.Decimal('130.5000') }
        ]
      }
    }
  });

  await prisma.consumoMateriaPrima.create({
    data: {
      orden_id: op3.id,
      lote_total_fabricar: new Prisma.Decimal('100.0000'),
      unidad_lote: 'Kg',
      codigo_balanza: 'Balanza Precisión Sartorius',
      fecha_consumo: new Date('2026-05-09'),
      total_programado: new Prisma.Decimal('100.0000'),
      total_real_consumido: new Prisma.Decimal('100.0000'),
      variacion_diferencia: new Prisma.Decimal('0.0000'),
      detalles: {
        create: [
          { materia_prima_id: mpHB.id, inventario_id: invHB.id, cantidad_programada: new Prisma.Decimal('10.0000'), peso_real_consumido: new Prisma.Decimal('10.0000') },
          { materia_prima_id: mpNI.id, inventario_id: invNI.id, cantidad_programada: new Prisma.Decimal('4.0000'), peso_real_consumido: new Prisma.Decimal('4.0000') },
          { materia_prima_id: mpAG.id, inventario_id: invAG.id, cantidad_programada: new Prisma.Decimal('86.0000'), peso_real_consumido: new Prisma.Decimal('86.0000') }
        ]
      }
    }
  });

  // 9. FABRICACIÓN EN PLANTA Y PASOS
  console.log('9. Insertando Registros de Fabricación y Pasos...');
  const fab1 = await prisma.registroFabricacion.create({
    data: {
      orden_id: op1.id,
      despeje_puede_iniciar: true,
      verificado_por: 'Carlos Mendoza (Operador) / Ing. Químico',
      fecha: new Date('2026-05-07'),
      pasos: {
        create: [
          { paso_numero: 1, procedimiento: 'Carga de agua purificada grado USP e inicio de agitación suave constante.', rpm: '350 RPM', temperatura: '22°C', tiempo: '15 min' },
          { paso_numero: 2, procedimiento: 'Adición progresiva de polímero espesante hasta completa hidratación sin grumos.', rpm: '900 RPM', temperatura: '22°C', tiempo: '25 min' },
          { paso_numero: 3, procedimiento: 'Incorporación de Ácido Hialurónico y Glicerina en frío hasta homogenización total.', rpm: '600 RPM', temperatura: '23°C', tiempo: '20 min' }
        ]
      }
    }
  });

  const fab2 = await prisma.registroFabricacion.create({
    data: {
      orden_id: op2.id,
      despeje_puede_iniciar: true,
      verificado_por: 'Diana Suárez (Operador) / Ing. Químico',
      fecha: new Date('2026-05-08'),
      pasos: {
        create: [
          { paso_numero: 1, procedimiento: 'Fase acuosa: disolución de glicerina y agua en reactor a 70°C.', rpm: '400 RPM', temperatura: '70°C', tiempo: '20 min' },
          { paso_numero: 2, procedimiento: 'Fase oleosa: fusión de manteca de karité y ceramidas en marmita auxiliar a 72°C.', rpm: '200 RPM', temperatura: '72°C', tiempo: '15 min' },
          { paso_numero: 3, procedimiento: 'Emulsificación: incorporación de fase oleosa a reactor con agitación turbo homogenizadora.', rpm: '1400 RPM', temperatura: '68°C', tiempo: '30 min' },
          { paso_numero: 4, procedimiento: 'Enfriamiento gradual hasta 35°C con agitación de palas.', rpm: '500 RPM', temperatura: '35°C', tiempo: '40 min' }
        ]
      }
    }
  });

  const fab3 = await prisma.registroFabricacion.create({
    data: {
      orden_id: op3.id,
      despeje_puede_iniciar: true,
      verificado_por: 'Carlos Mendoza (Operador) / Ing. Químico',
      fecha: new Date('2026-05-10'),
      pasos: {
        create: [
          { paso_numero: 1, procedimiento: 'Mezcla de agua desionizada con Niacinamida y extracto botánico.', rpm: '300 RPM', temperatura: '21°C', tiempo: '15 min' },
          { paso_numero: 2, procedimiento: 'Filtración clarificante por membrana estéril de 0.45 micras hacia tanque pulmón.', rpm: 'Bomba 1.8 bar', temperatura: '21°C', tiempo: '20 min' }
        ]
      }
    }
  });

  // 10. CONTROL DE CALIDAD Y PARÁMETROS COA
  console.log('10. Insertando Control de Calidad y Certificados COA...');
  await prisma.registroControlCalidad.create({
    data: {
      orden_id: op1.id,
      fecha: new Date('2026-05-09'),
      muestra_aprobada: true,
      analizado_por: 'Dra. María Restrepo (QC Analista)',
      revisado_por: 'Dra. Elena Ramírez (Dirección Técnica)',
      parametros: {
        create: [
          { parametro: 'Densidad a 20°C (g/mL)', especificacion: '1.010 - 1.040', resultado: '1.025', cumple: true },
          { parametro: 'pH a 25°C', especificacion: '5.50 - 6.50', resultado: '5.85', cumple: true },
          { parametro: 'Viscosidad Brookfield (cP)', especificacion: '2500 - 4500 cP (Sp 4, 20 RPM)', resultado: '3200 cP', cumple: true },
          { parametro: 'Aspecto Organoléptico', especificacion: 'Líquido viscoso homogéneo translúcido', resultado: 'Conforme', cumple: true },
          { parametro: 'Recuento Microbiológico', especificacion: '< 100 UFC/g (Sin patógenos)', resultado: '< 10 UFC/g', cumple: true }
        ]
      }
    }
  });

  await prisma.registroControlCalidad.create({
    data: {
      orden_id: op2.id,
      fecha: new Date('2026-05-10'),
      muestra_aprobada: true,
      analizado_por: 'Dr. Julián Vélez (QC Analista)',
      revisado_por: 'Dra. Elena Ramírez (Dirección Técnica)',
      parametros: {
        create: [
          { parametro: 'Densidad a 20°C (g/mL)', especificacion: '0.980 - 1.020', resultado: '0.995', cumple: true },
          { parametro: 'pH a 25°C', especificacion: '5.00 - 6.00', resultado: '5.45', cumple: true },
          { parametro: 'Viscosidad Brookfield (cP)', especificacion: '18000 - 24000 cP (Sp 6, 10 RPM)', resultado: '21500 cP', cumple: true },
          { parametro: 'Aspecto Organoléptico', especificacion: 'Emulsión O/W blanca marfil brillante', resultado: 'Conforme', cumple: true },
          { parametro: 'Recuento Microbiológico', especificacion: '< 100 UFC/g (Sin patógenos)', resultado: 'Ausencia', cumple: true }
        ]
      }
    }
  });

  await prisma.registroControlCalidad.create({
    data: {
      orden_id: op3.id,
      fecha: new Date('2026-05-11'),
      muestra_aprobada: true,
      analizado_por: 'Dra. María Restrepo (QC Analista)',
      revisado_por: 'Dra. Elena Ramírez (Dirección Técnica)',
      parametros: {
        create: [
          { parametro: 'Densidad a 20°C (g/mL)', especificacion: '1.000 - 1.015', resultado: '1.008', cumple: true },
          { parametro: 'pH a 25°C', especificacion: '5.00 - 5.60', resultado: '5.20', cumple: true },
          { parametro: 'Aspecto Organoléptico', especificacion: 'Líquido límpido ámbar claro con aroma floral', resultado: 'Conforme', cumple: true },
          { parametro: 'Recuento Microbiológico', especificacion: '< 100 UFC/g', resultado: '< 10 UFC/g', cumple: true }
        ]
      }
    }
  });

  // 11. REGISTROS DE ENVASADO (LOTES EN VIRTUD DEL ESQUEMA)
  console.log('11. Insertando Registros de Envasado...');
  await prisma.registroEnvasado.create({
    data: {
      orden_id: op1.id,
      fecha_envasado: new Date('2026-05-09'),
      total_unidades: new Prisma.Decimal('5000.00'),
      densidad: new Prisma.Decimal('1.0250'),
      balance_cantidad_envasada: new Prisma.Decimal('150.0000'),
      firma_responsable_nombre: 'Carlos Mendoza'
    }
  });

  await prisma.registroEnvasado.create({
    data: {
      orden_id: op2.id,
      fecha_envasado: new Date('2026-05-10'),
      total_unidades: new Prisma.Decimal('3000.00'),
      densidad: new Prisma.Decimal('0.9950'),
      balance_cantidad_envasada: new Prisma.Decimal('150.0000'),
      firma_responsable_nombre: 'Diana Suárez'
    }
  });

  await prisma.registroEnvasado.create({
    data: {
      orden_id: op3.id,
      fecha_envasado: new Date('2026-05-11'),
      total_unidades: new Prisma.Decimal('2000.00'),
      densidad: new Prisma.Decimal('1.0080'),
      balance_cantidad_envasada: new Prisma.Decimal('100.0000'),
      firma_responsable_nombre: 'Carlos Mendoza'
    }
  });

  console.log('✅ ¡Sembrado Completo Exitoso en PostgreSQL (Neon)!');
}

seed()
  .catch((e) => {
    console.error('❌ Error durante el sembrado:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

