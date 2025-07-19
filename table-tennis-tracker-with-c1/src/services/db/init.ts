import { PrismaClient } from "@prisma/client";
import { randomInt, randomBytes } from "crypto";

export async function initializeDb(prisma: PrismaClient) {
  // Check if there are any existing transactions
  const existingPlayer = await prisma.player.findFirst();
  console.log("existingPlayer", existingPlayer);
  // If there are no players, seed the database
  if (!existingPlayer) {
    console.log("No players found, seeding database...");
    const playerNames = [
      "Abhishek",
      "Aditya",
      "Rabi",
      "Subham",
      "Parikshit",
      "Zahle",
    ];
    const players = [];

    const skillLevels = [60, 50, 40, 30, 20, 10];

    for (let i = 0; i < playerNames.length; i++) {
      const player = await prisma.player.create({
        data: {
          name: playerNames[i],
          skill: skillLevels[i],
        },
      });
      players.push(player);
      console.log(`Created player ${player.name} with skill ${player.skill}`);
    }

    for (let i = 0; i < 100; i++) {
      const playerA = players[randomInt(0, players.length)];
      let playerB = players[randomInt(0, players.length)];

      // Ensure players are not the same
      while (playerA.id === playerB.id) {
        playerB = players[randomInt(0, players.length)];
      }

      const scoreProbability = playerA.skill / (playerA.skill + playerB.skill);
      const playerAWins = Math.random() < scoreProbability;

      let playerAScore;
      let playerBScore;

      if (playerAWins) {
        playerAScore = 11;
        playerBScore = randomInt(0, 10);
      } else {
        playerBScore = 11;
        playerAScore = randomInt(0, 10);
      }

      let winnerId = null;
      let status = "COMPLETED";

      if (playerAScore > playerBScore) {
        winnerId = playerA.id;
      } else {
        winnerId = playerB.id;
      }

      const game = await prisma.game.create({
        data: {
          id: randomBytes(4).toString("hex"),
          playerAId: playerA.id,
          playerBId: playerB.id,
          playerAScore,
          playerBScore,
          winnerId,
          status,
        },
      });
      console.log(`Created game with id: ${game.id}`);
    }
  }
}

// Handle cleanup when the Node process is terminated
process.on("beforeExit", async () => {
  await prisma?.$disconnect();
});
