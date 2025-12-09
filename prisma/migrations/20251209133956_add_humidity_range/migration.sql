/*
  Warnings:

  - You are about to drop the column `humidity` on the `Threshold` table. All the data in the column will be lost.

*/

-- Add new columns first (safe if they already exist)
ALTER TABLE "public"."Threshold" 
  ADD COLUMN IF NOT EXISTS "relativeHumidityMin" INTEGER,
  ADD COLUMN IF NOT EXISTS "relativeHumidityMax" INTEGER;

-- Migrate data and drop old column (only if it exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'Threshold' 
      AND column_name = 'humidity'
  ) THEN
    -- Copy existing data to new columns
    UPDATE "public"."Threshold" 
    SET "relativeHumidityMin" = "humidity",
        "relativeHumidityMax" = "humidity"
    WHERE "humidity" IS NOT NULL;
    
    -- Drop the old column
    ALTER TABLE "public"."Threshold" 
    DROP COLUMN "humidity";
  END IF;
END $$;