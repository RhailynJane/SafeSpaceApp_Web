-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "author_user_id" INTEGER NOT NULL,
    "note_date" DATE NOT NULL,
    "session_type" TEXT,
    "duration_minutes" INTEGER,
    "summary" TEXT,
    "detailed_notes" TEXT,
    "risk_assessment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
