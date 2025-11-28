-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "state" TEXT NOT NULL DEFAULT 'Florida',
    "zoneId" TEXT NOT NULL,
    "deviceToken" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Threshold" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "temperature" INTEGER,
    "humidity" INTEGER,
    "dispersionIndexMin" INTEGER,
    "dispersionIndexMax" INTEGER,
    "southDirMin" INTEGER,
    "northDirMin" INTEGER,
    "eastDirMin" INTEGER,
    "westDirMin" INTEGER,
    "northEastDirMin" INTEGER,
    "northWestDirMin" INTEGER,
    "southEastDirMin" INTEGER,
    "southWestDirMin" INTEGER,
    "southDirMax" INTEGER,
    "northDirMax" INTEGER,
    "eastDirMax" INTEGER,
    "westDirMax" INTEGER,
    "northEastDirMax" INTEGER,
    "northWestDirMax" INTEGER,
    "southEastDirMax" INTEGER,
    "southWestDirMax" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Threshold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'weather_alert',
    "severity" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Threshold_userId_key" ON "public"."Threshold"("userId");

-- AddForeignKey
ALTER TABLE "public"."Threshold" ADD CONSTRAINT "Threshold_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
