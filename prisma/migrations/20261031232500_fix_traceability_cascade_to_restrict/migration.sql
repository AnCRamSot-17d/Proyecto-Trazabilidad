-- DropForeignKey
ALTER TABLE "consumo_materia_prima" DROP CONSTRAINT "consumo_materia_prima_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "detalle_consumo_materia_prima" DROP CONSTRAINT "detalle_consumo_materia_prima_consumo_id_fkey";

-- DropForeignKey
ALTER TABLE "parametro_calidad" DROP CONSTRAINT "parametro_calidad_control_calidad_id_fkey";

-- DropForeignKey
ALTER TABLE "paso_fabricacion" DROP CONSTRAINT "paso_fabricacion_fabricacion_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_acondicionamiento_etiquetado" DROP CONSTRAINT "registro_acondicionamiento_etiquetado_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_acondicionamiento_loteo" DROP CONSTRAINT "registro_acondicionamiento_loteo_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_control_calidad" DROP CONSTRAINT "registro_control_calidad_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_dispensacion" DROP CONSTRAINT "registro_dispensacion_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_envasado" DROP CONSTRAINT "registro_envasado_orden_id_fkey";

-- DropForeignKey
ALTER TABLE "registro_fabricacion" DROP CONSTRAINT "registro_fabricacion_orden_id_fkey";

-- AddForeignKey
ALTER TABLE "consumo_materia_prima" ADD CONSTRAINT "consumo_materia_prima_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_consumo_materia_prima" ADD CONSTRAINT "detalle_consumo_materia_prima_consumo_id_fkey" FOREIGN KEY ("consumo_id") REFERENCES "consumo_materia_prima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_dispensacion" ADD CONSTRAINT "registro_dispensacion_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_fabricacion" ADD CONSTRAINT "registro_fabricacion_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paso_fabricacion" ADD CONSTRAINT "paso_fabricacion_fabricacion_id_fkey" FOREIGN KEY ("fabricacion_id") REFERENCES "registro_fabricacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_control_calidad" ADD CONSTRAINT "registro_control_calidad_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametro_calidad" ADD CONSTRAINT "parametro_calidad_control_calidad_id_fkey" FOREIGN KEY ("control_calidad_id") REFERENCES "registro_control_calidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_envasado" ADD CONSTRAINT "registro_envasado_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_acondicionamiento_etiquetado" ADD CONSTRAINT "registro_acondicionamiento_etiquetado_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_acondicionamiento_loteo" ADD CONSTRAINT "registro_acondicionamiento_loteo_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "orden_produccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
