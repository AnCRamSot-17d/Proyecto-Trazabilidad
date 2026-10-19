-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialLot" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawMaterialLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialConsumption" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "rawMaterialLotId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "MaterialConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishedProductLot" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "manufacturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinishedProductLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityControl" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "status" "QualityStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "shippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraceabilityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rawMaterialLotId" TEXT,
    "productionOrderId" TEXT,
    "finishedProductLotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraceabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterial_code_key" ON "RawMaterial"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RawMaterialLot_code_key" ON "RawMaterialLot"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_code_key" ON "ProductionOrder"("code");

-- CreateIndex
CREATE INDEX "MaterialConsumption_rawMaterialLotId_idx" ON "MaterialConsumption"("rawMaterialLotId");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialConsumption_productionOrderId_rawMaterialLotId_key" ON "MaterialConsumption"("productionOrderId", "rawMaterialLotId");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedProductLot_code_key" ON "FinishedProductLot"("code");

-- CreateIndex
CREATE INDEX "FinishedProductLot_productionOrderId_idx" ON "FinishedProductLot"("productionOrderId");

-- CreateIndex
CREATE INDEX "QualityControl_lotId_idx" ON "QualityControl"("lotId");

-- CreateIndex
CREATE INDEX "InventoryMovement_lotId_idx" ON "InventoryMovement"("lotId");

-- CreateIndex
CREATE INDEX "Shipment_lotId_idx" ON "Shipment"("lotId");

-- CreateIndex
CREATE INDEX "TraceabilityEvent_rawMaterialLotId_idx" ON "TraceabilityEvent"("rawMaterialLotId");

-- CreateIndex
CREATE INDEX "TraceabilityEvent_productionOrderId_idx" ON "TraceabilityEvent"("productionOrderId");

-- CreateIndex
CREATE INDEX "TraceabilityEvent_finishedProductLotId_idx" ON "TraceabilityEvent"("finishedProductLotId");

-- AddForeignKey
ALTER TABLE "RawMaterialLot" ADD CONSTRAINT "RawMaterialLot_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialLot" ADD CONSTRAINT "RawMaterialLot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialConsumption" ADD CONSTRAINT "MaterialConsumption_rawMaterialLotId_fkey" FOREIGN KEY ("rawMaterialLotId") REFERENCES "RawMaterialLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedProductLot" ADD CONSTRAINT "FinishedProductLot_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityControl" ADD CONSTRAINT "QualityControl_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "FinishedProductLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "FinishedProductLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "FinishedProductLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityEvent" ADD CONSTRAINT "TraceabilityEvent_rawMaterialLotId_fkey" FOREIGN KEY ("rawMaterialLotId") REFERENCES "RawMaterialLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityEvent" ADD CONSTRAINT "TraceabilityEvent_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraceabilityEvent" ADD CONSTRAINT "TraceabilityEvent_finishedProductLotId_fkey" FOREIGN KEY ("finishedProductLotId") REFERENCES "FinishedProductLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
