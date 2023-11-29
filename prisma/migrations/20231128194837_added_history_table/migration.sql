-- CreateEnum
CREATE TYPE "HistoryState" AS ENUM ('Watched', 'Canceled', 'NoWatchProviderAvailable');

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userIds" TEXT[],
    "state" "HistoryState" NOT NULL DEFAULT 'Watched',

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);
