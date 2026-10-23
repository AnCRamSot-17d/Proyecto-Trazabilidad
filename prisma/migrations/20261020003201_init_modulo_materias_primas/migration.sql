-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "numero_pedido" TEXT NOT NULL,
    "cliente_marca" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "pedido_id" UUID,
    "codigo_unico" TEXT NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "presentaciones" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materia_prima" (
    "id" UUID NOT NULL,
    "codigo_materia_prima" TEXT NOT NULL,
    "nombre_insumo" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,

    CONSTRAINT "materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_materia_prima" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "materia_prima_id" UUID NOT NULL,
    "porcentaje_o_proporcion" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "producto_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_materia_prima" (
    "id" UUID NOT NULL,
    "materia_prima_id" UUID NOT NULL,
    "lote_interno" TEXT NOT NULL,
    "stock_disponible" DECIMAL(12,4) NOT NULL,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingreso_materia_prima" (
    "id" UUID NOT NULL,
    "materia_prima_id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "lote_proveedor" TEXT NOT NULL,
    "cantidad_recibida" DECIMAL(12,4) NOT NULL,
    "proveedor" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingreso_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_materia_prima" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "lote_total_fabricar" DECIMAL(12,4) NOT NULL,
    "unidad_lote" TEXT NOT NULL,
    "fecha_consumo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_balanza" TEXT,
    "total_programado" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "total_real_consumido" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "variacion_diferencia" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "consumo_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_consumo_materia_prima" (
    "id" UUID NOT NULL,
    "consumo_id" UUID NOT NULL,
    "materia_prima_id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "cantidad_programada" DECIMAL(12,4) NOT NULL,
    "peso_real_consumido" DECIMAL(12,4) NOT NULL DEFAULT 0,

    CONSTRAINT "detalle_consumo_materia_prima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_pedido_key" ON "pedidos"("numero_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_unico_key" ON "productos"("codigo_unico");

-- CreateIndex
CREATE UNIQUE INDEX "materia_prima_codigo_materia_prima_key" ON "materia_prima"("codigo_materia_prima");

-- CreateIndex
CREATE UNIQUE INDEX "producto_materia_prima_producto_id_materia_prima_id_key" ON "producto_materia_prima"("producto_id", "materia_prima_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_materia_prima_lote_interno_key" ON "inventario_materia_prima"("lote_interno");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_materia_prima" ADD CONSTRAINT "producto_materia_prima_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_materia_prima" ADD CONSTRAINT "producto_materia_prima_materia_prima_id_fkey" FOREIGN KEY ("materia_prima_id") REFERENCES "materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_materia_prima" ADD CONSTRAINT "inventario_materia_prima_materia_prima_id_fkey" FOREIGN KEY ("materia_prima_id") REFERENCES "materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_materia_prima" ADD CONSTRAINT "ingreso_materia_prima_materia_prima_id_fkey" FOREIGN KEY ("materia_prima_id") REFERENCES "materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_materia_prima" ADD CONSTRAINT "ingreso_materia_prima_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario_materia_prima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumo_materia_prima" ADD CONSTRAINT "consumo_materia_prima_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_consumo_materia_prima" ADD CONSTRAINT "detalle_consumo_materia_prima_consumo_id_fkey" FOREIGN KEY ("consumo_id") REFERENCES "consumo_materia_prima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_consumo_materia_prima" ADD CONSTRAINT "detalle_consumo_materia_prima_materia_prima_id_fkey" FOREIGN KEY ("materia_prima_id") REFERENCES "materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_consumo_materia_prima" ADD CONSTRAINT "detalle_consumo_materia_prima_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventario_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
