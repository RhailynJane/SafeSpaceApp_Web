/*
  Warnings:

  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role_id" INTEGER;

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "therapist_id" INTEGER NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "session_type_id" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "type" TEXT,
    "duration" TEXT,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_session_type_id_fkey" FOREIGN KEY ("session_type_id") REFERENCES "session_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
