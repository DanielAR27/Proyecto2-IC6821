// services/statisticsService.js

import { getTeamLastEvents } from './sportsApiService';

// Función para calcular las estadísticas del equipo
function calculateTeamStatistics(teamName, matches) {
  let played = 0, wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;

  if (!matches || matches.length === 0) {
    return { played, wins, draws, losses, goalsFor, goalsAgainst };
  }

  matches.forEach(match => {
    const isHome = match.strHomeTeam === teamName;
    const isAway = match.strAwayTeam === teamName;

    if (!isHome && !isAway) {
      return; // Este partido no involucra al equipo
    }

    const homeGoals = match.intHomeScore !== null ? parseInt(match.intHomeScore, 10) : null;
    const awayGoals = match.intAwayScore !== null ? parseInt(match.intAwayScore, 10) : null;

    if (homeGoals === null || awayGoals === null) {
      return; // Partido sin resultado
    }

    played++;

    let goalsScored = 0;
    let goalsConceded = 0;

    if (isHome) {
      goalsScored = homeGoals;
      goalsConceded = awayGoals;
    } else {
      goalsScored = awayGoals;
      goalsConceded = homeGoals;
    }

    goalsFor += goalsScored;
    goalsAgainst += goalsConceded;

    if (goalsScored > goalsConceded) {
      wins++;
    } else if (goalsScored === goalsConceded) {
      draws++;
    } else {
      losses++;
    }
  });

  return { played, wins, draws, losses, goalsFor, goalsAgainst };
}

// Función principal: obtiene estadísticas del equipo
export async function getTeamStatistics(teamId, leagueId = null, season = "2023-2024") {
  try {
    const matches = await getTeamLastEvents(teamId);

    if (!Array.isArray(matches)) {
      console.error('Matches no es un array:', matches);
      return null;
    }

    let matchesPlayed = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matches.forEach(match => {
      if (!match) return;
      const isHome = match.idHomeTeam == teamId;
      const homeGoals = parseInt(match.intHomeScore, 10);
      const awayGoals = parseInt(match.intAwayScore, 10);

      if (isNaN(homeGoals) || isNaN(awayGoals)) return; // partido inválido

      matchesPlayed++;

      if (isHome) {
        goalsFor += homeGoals;
        goalsAgainst += awayGoals;
        if (homeGoals > awayGoals) wins++;
        else if (homeGoals === awayGoals) draws++;
        else losses++;
      } else {
        goalsFor += awayGoals;
        goalsAgainst += homeGoals;
        if (awayGoals > homeGoals) wins++;
        else if (awayGoals === homeGoals) draws++;
        else losses++;
      }
    });

    return {
      matchesPlayed,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      position: null, // Por ahora, porque aún no conectamos con getLeagueTable
    };
  } catch (error) {
    console.error("Error fetching team statistics:", error);
    return null;
  }
}
