-- CreateTable
CREATE TABLE "shortages" (
    "id" SERIAL NOT NULL,
    "gtin" TEXT NOT NULL,
    "pharmacode" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "firma" TEXT NOT NULL,
    "atcCode" TEXT NOT NULL,
    "gengrp" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "statusText" TEXT NOT NULL,
    "datumLieferfahigkeit" TEXT NOT NULL,
    "datumLetzteMutation" TEXT NOT NULL,
    "tageSeitMeldung" INTEGER NOT NULL,
    "detailUrl" TEXT NOT NULL,
    "alternativenUrl" TEXT,
    "ersteMeldung" TEXT,
    "ersteMeldungDurch" TEXT,
    "ersteInfoDurchFirma" TEXT,
    "artDerInfoDurchFirma" TEXT,
    "voraussichtlicheDauer" TEXT,
    "bemerkungen" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "shortages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overview_stats" (
    "id" SERIAL NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "totalPackungen" INTEGER NOT NULL,
    "totalProdukte" INTEGER NOT NULL,
    "betroffeneAtcGruppen" INTEGER NOT NULL,
    "pflichtlager" INTEGER NOT NULL,
    "bwl" INTEGER NOT NULL,
    "bwlWho" INTEGER NOT NULL,
    "who" INTEGER NOT NULL,
    "kassenpflichtigSL" INTEGER NOT NULL,
    "kassenpflichtigSLTotal" INTEGER NOT NULL,
    "prozentSLNichtLieferbar" DOUBLE PRECISION NOT NULL,
    "dauerUnter2Wochen" INTEGER NOT NULL,
    "dauer2bis6Wochen" INTEGER NOT NULL,
    "dauerUeber6WochenBis6Monate" INTEGER NOT NULL,
    "dauerUeber6MonateBis1Jahr" INTEGER NOT NULL,
    "dauerUeber1Bis2Jahre" INTEGER NOT NULL,
    "dauerUeber2Jahre" INTEGER NOT NULL,
    "swissmedicListeA" INTEGER NOT NULL,
    "swissmedicListeATotal" INTEGER NOT NULL,
    "swissmedicListeB" INTEGER NOT NULL,
    "swissmedicListeBTotal" INTEGER NOT NULL,
    "swissmedicListeC" INTEGER NOT NULL,
    "swissmedicListeCTotal" INTEGER NOT NULL,
    "swissmedicUebrige" INTEGER NOT NULL,
    "swissmedicUebrigeTotal" INTEGER NOT NULL,
    "firmenRanking" JSONB NOT NULL,
    "atcGruppen" JSONB NOT NULL,

    CONSTRAINT "overview_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_runs" (
    "id" SERIAL NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "newEntries" INTEGER NOT NULL,
    "removedEntries" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shortages_gtin_key" ON "shortages"("gtin");
