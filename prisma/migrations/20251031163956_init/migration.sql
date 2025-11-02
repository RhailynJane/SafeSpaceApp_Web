/*
  Warnings:

  - You are about to drop the column `client_id` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the `ClientSupportWorker` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `referral_statuses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_alerts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ClientSupportWorker" DROP CONSTRAINT "ClientSupportWorker_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClientSupportWorker" DROP CONSTRAINT "ClientSupportWorker_support_worker_id_fkey";

-- DropIndex
DROP INDEX "public"."clients_client_id_key";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "client_id";

-- DropTable
DROP TABLE "public"."ClientSupportWorker";

-- DropTable
DROP TABLE "public"."referral_statuses";

-- DropTable
DROP TABLE "public"."system_alerts";

-- CreateTable
CREATE TABLE "client_support_worker" (
    "client_id" INTEGER NOT NULL,
    "support_worker_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_support_worker_pkey" PRIMARY KEY ("client_id","support_worker_id")
);

-- AddForeignKey
ALTER TABLE "client_support_worker" ADD CONSTRAINT "client_support_worker_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_support_worker" ADD CONSTRAINT "client_support_worker_support_worker_id_fkey" FOREIGN KEY ("support_worker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
