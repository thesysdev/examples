import prisma from "./db/index";
import { randomBytes } from "crypto";

export const startGame = async (player1Name: string, player2Name: string) => {
  const player1 = await prisma.player.upsert({
    where: { name: player1Name },
    update: {},
    create: { name: player1Name },
  });

  const player2 = await prisma.player.upsert({
    where: { name: player2Name },
    update: {},
    create: { name: player2Name },
  });

  const gameId = randomBytes(4).toString("hex");
  const game = await prisma.game.create({
    data: {
      id: gameId,
      playerAId: player1.id,
      playerBId: player2.id,
    },
  });

  return {
    ...game,
    playerAName: player1.name,
    playerBName: player2.name,
  };
};

export const recordPoints = async (
  gameId: string,
  playerAScore: number,
  playerBScore: number,
) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { playerA: true, playerB: true },
  });

  if (!game) {
    return { error: "Game not found. Please provide a valid game ID." };
  }

  if (game.status === "COMPLETED") {
    return {
      ...game,
      error:
        "This game has already been completed. No more points can be recorded.",
    };
  }

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      playerAScore,
      playerBScore,
    },
    include: { playerA: true, playerB: true },
  });

  // Check for winner
  if (
    (updatedGame.playerAScore >= 11 &&
      updatedGame.playerAScore - updatedGame.playerBScore >= 2) ||
    (updatedGame.playerBScore >= 11 &&
      updatedGame.playerBScore - updatedGame.playerAScore >= 2)
  ) {
    const winnerId =
      updatedGame.playerAScore > updatedGame.playerBScore
        ? updatedGame.playerAId
        : updatedGame.playerBId;

    return await prisma.game.update({
      where: { id: gameId },
      data: {
        winnerId,
        status: "COMPLETED",
      },
    });
  }

  return updatedGame;
};

export const getScore = async (gameId: string) => {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: { playerA: true, playerB: true },
  });

  return {
    playerA: game.playerA.name,
    playerB: game.playerB.name,
    scoreA: game.playerAScore,
    scoreB: game.playerBScore,
    status: game.status,
  };
};

export const getMatchHistory = async (playerName: string) => {
  const players = await prisma.player.findMany();
  console.log("players", players);
  const player = await prisma.player.findUnique({
    where: { name: playerName },
    include: {
      gamesA: {
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      },
      gamesB: {
        include: {
          playerA: true,
          playerB: true,
          winner: true,
        },
      },
    },
  });

  if (!player) {
    return [];
  }

  const games = [...player.gamesA, ...player.gamesB];

  return games.map((game) => ({
    gameId: game.id,
    playerA: game.playerA.name,
    playerB: game.playerB.name,
    scoreA: game.playerAScore,
    scoreB: game.playerBScore,
    winner: game.winner?.name,
    date: game.createdAt,
  }));
};

export const getPlayerStats = async (playerName: string) => {
  const player = await prisma.player.findUnique({
    where: { name: playerName },
    include: {
      gamesA: true,
      gamesB: true,
      wins: true,
    },
  });

  if (!player) {
    return [];
  }

  const totalGames = player.gamesA.length + player.gamesB.length;
  const wins = player.wins.length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  return {
    name: player.name,
    totalGames,
    wins,
    losses,
    winRate: `${winRate.toFixed(2)}%`,
  };
};

export const comparePlayers = async (
  player1Name: string,
  player2Name: string,
) => {
  const games = await prisma.game.findMany({
    where: {
      OR: [
        {
          playerA: { name: player1Name },
          playerB: { name: player2Name },
        },
        {
          playerA: { name: player2Name },
          playerB: { name: player1Name },
        },
      ],
    },
    include: {
      playerA: true,
      playerB: true,
      winner: true,
    },
  });

  const player1Wins = games.filter(
    (game) => game.winner?.name === player1Name,
  ).length;
  const player2Wins = games.filter(
    (game) => game.winner?.name === player2Name,
  ).length;

  return {
    player1: {
      name: player1Name,
      wins: player1Wins,
    },
    player2: {
      name: player2Name,
      wins: player2Wins,
    },
    headToHead: games.map((game) => ({
      gameId: game.id,
      playerA: game.playerA.name,
      playerB: game.playerB.name,
      scoreA: game.playerAScore,
      scoreB: game.playerBScore,
      winner: game.winner?.name,
      date: game.createdAt,
    })),
  };
};

export const getLeaderboard = async () => {
  const players = await prisma.player.findMany({
    include: {
      _count: {
        select: { wins: true },
      },
    },
  });
  console.log("players", players);

  const leaderboard = players
    .map((p) => ({
      name: p.name,
      wins: p._count.wins,
    }))
    .sort((a, b) => b.wins - a.wins);

  return leaderboard;
};
