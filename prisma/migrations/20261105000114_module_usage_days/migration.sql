-- CreateTable
CREATE TABLE "module_usage_days" (
    "organization_id" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "module_usage_days_pkey" PRIMARY KEY ("organization_id","area","day")
);

-- CreateIndex
CREATE INDEX "module_usage_days_day_idx" ON "module_usage_days"("day");

-- AddForeignKey
ALTER TABLE "module_usage_days" ADD CONSTRAINT "module_usage_days_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "module_usage_days" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_usage_days_deny_all" ON "module_usage_days" FOR ALL USING (false) WITH CHECK (false);
