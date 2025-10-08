/*
  Warnings:

  - You are about to drop the column `role_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_role_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role_id",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'patient';

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "client_first_name" TEXT NOT NULL,
    "client_last_name" TEXT NOT NULL,
    "status" TEXT,
    "last_session_date" TIMESTAMP(3),
    "risk_level" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER,
    "client_first_name" TEXT NOT NULL,
    "client_last_name" TEXT NOT NULL,
    "age" INTEGER,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "emergency_first_name" TEXT,
    "emergency_last_name" TEXT,
    "emergency_phone" TEXT,
    "referral_source" TEXT NOT NULL,
    "reason_for_referral" TEXT NOT NULL,
    "additional_notes" TEXT,
    "submitted_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "processed_date" TIMESTAMP(3),
    "processed_by_user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_timeline" (
    "id" SERIAL NOT NULL,
    "referralId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_id_key" ON "clients"("client_id");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_processed_by_user_id_fkey" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_timeline" ADD CONSTRAINT "referral_timeline_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
