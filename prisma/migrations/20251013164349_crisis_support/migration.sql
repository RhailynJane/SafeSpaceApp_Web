/*
  Warnings:

  - You are about to drop the `crisis_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_initiator_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."crisis_events" DROP CONSTRAINT "crisis_events_supervisor_contacted_user_id_fkey";

-- DropTable
DROP TABLE "public"."crisis_events";
