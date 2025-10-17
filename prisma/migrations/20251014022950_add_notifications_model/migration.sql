/*
  Warnings:

  - Made the column `updated_at` on table `crisis_events` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_initiator_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_supervisor_contacted_user_id_fkey";

-- AlterTable
ALTER TABLE "crisis_events" ALTER COLUMN "event_type" SET DATA TYPE TEXT,
ALTER COLUMN "event_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "risk_level_at_event" SET DATA TYPE TEXT,
ALTER COLUMN "contact_method" SET DATA TYPE TEXT,
ALTER COLUMN "contact_purpose" SET DATA TYPE TEXT,
ALTER COLUMN "urgency_level" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "related_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_initiator_user_id_fkey" FOREIGN KEY ("initiator_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crisis_events" ADD CONSTRAINT "crisis_events_supervisor_contacted_user_id_fkey" FOREIGN KEY ("supervisor_contacted_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
