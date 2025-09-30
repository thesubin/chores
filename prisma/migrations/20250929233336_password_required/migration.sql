/*
  Warnings:

  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing users with NULL passwords to have a default password (bcrypt hashed)
UPDATE "public"."User" SET "password" = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE "password" IS NULL;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "password" SET NOT NULL;
