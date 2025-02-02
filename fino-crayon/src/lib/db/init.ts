import { PrismaClient } from "@prisma/client";
import { randomInt } from "crypto";

export async function initializeDb(prisma: PrismaClient) {
  // Check if there are any existing transactions
  const existingTransaction = await prisma.transaction.findFirst();

  if (!existingTransaction) {
    const debitCategories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Utilities",
      "Healthcare",
      "Shopping",
      "Education",
    ];

    const creditCategories = [
      "Salary",
      "Investment",
      "Refund",
      "Gift",
      "Bonus",
    ];

    // Generate transactions with approximately 5:1 ratio of debits to credits
    const transactions = Array.from({ length: 100 }, (_, i) => {
      const transactionType = i % 6 === 0 ? "credit" : "debit";
      const amount = Number((Math.random() * 490 + 10).toFixed(2)); // Random amount between 10 and 500, rounded to 2 decimal places
      const finalAmount = transactionType === "credit" ? amount : -amount;

      const category =
        transactionType === "credit"
          ? creditCategories[
              Math.floor(Math.random() * creditCategories.length)
            ]
          : debitCategories[Math.floor(Math.random() * debitCategories.length)];

      const date = new Date();
      date.setDate(date.getDate() - randomInt(1, 365)); // Random date within the last year

      return {
        date,
        amount,
        balance: finalAmount,
        category,
        description: "Mock transaction",
        transaction_type: transactionType,
      };
    });

    // Create all transactions in a single transaction
    await prisma.transaction.createMany({
      data: transactions,
    });
  }
}

// Handle cleanup when the Node process is terminated
process.on("beforeExit", async () => {
  await prisma?.$disconnect();
});
