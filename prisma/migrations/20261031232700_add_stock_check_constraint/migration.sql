-- Asegurar consistencia previa de datos antes del constraint
UPDATE "inventario_materia_prima" SET "stock_disponible" = 0 WHERE "stock_disponible" < 0;

-- Restricción de integridad para impedir stock negativo
ALTER TABLE "inventario_materia_prima"
ADD CONSTRAINT "check_stock_no_negativo" CHECK ("stock_disponible" >= 0);
