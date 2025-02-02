-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "balance" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "transaction_type" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Transaction_id_idx" ON "Transaction"("id");
