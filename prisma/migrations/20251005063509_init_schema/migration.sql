-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "clerk_user_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priority_levels" (
    "id" SERIAL NOT NULL,
    "level_name" TEXT NOT NULL,
    "order_rank" INTEGER,

    CONSTRAINT "priority_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_statuses" (
    "id" SERIAL NOT NULL,
    "status_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "referral_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_types" (
    "id" SERIAL NOT NULL,
    "type_name" TEXT NOT NULL,

    CONSTRAINT "session_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_levels" (
    "id" SERIAL NOT NULL,
    "level_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "risk_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "priority_levels_level_name_key" ON "priority_levels"("level_name");

-- CreateIndex
CREATE UNIQUE INDEX "referral_statuses_status_name_key" ON "referral_statuses"("status_name");

-- CreateIndex
CREATE UNIQUE INDEX "session_types_type_name_key" ON "session_types"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "risk_levels_level_name_key" ON "risk_levels"("level_name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
