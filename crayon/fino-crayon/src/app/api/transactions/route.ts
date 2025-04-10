import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json({
      transactions,
    });
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, amount, category, description, transaction_type } = body;

    // Validate required fields
    if (!date || !amount || !category || !transaction_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (!["credit", "debit"].includes(transaction_type)) {
      return NextResponse.json(
        { error: "Invalid transaction type. Must be 'credit' or 'debit'" },
        { status: 400 }
      );
    }

    // Calculate balance based on transaction type
    const balance = transaction_type === "credit" ? amount : -amount;

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        amount,
        balance,
        category,
        description: description || "No description provided",
        transaction_type,
      },
    });

    return NextResponse.json({
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
