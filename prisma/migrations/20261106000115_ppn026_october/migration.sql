-- AlterTable
ALTER TABLE "sv_measures" ADD COLUMN     "code" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "sv_commitments" ADD COLUMN     "measure_id" TEXT;

-- AlterTable
ALTER TABLE "sv_activities" ADD COLUMN     "cohort_counts" JSONB;

-- CreateIndex
CREATE INDEX "sv_commitments_measure_id_idx" ON "sv_commitments"("measure_id");

-- AddForeignKey
ALTER TABLE "sv_commitments" ADD CONSTRAINT "sv_commitments_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "sv_measures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

