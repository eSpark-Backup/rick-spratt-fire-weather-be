/*
  Warnings:

  - You are about to drop the column `relativeHumidityMax` on the `Threshold` table. All the data in the column will be lost.
  - You are about to drop the column `relativeHumidityMin` on the `Threshold` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Threshold" DROP COLUMN "relativeHumidityMax",
DROP COLUMN "relativeHumidityMin",
ADD COLUMN     "relativeHumidity" INTEGER;
