// Sports API service for communicating with TheSportsDB API

const API_BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const API_KEY = '680723'; // Your API key

// Function to handle API errors
const handleApiError = (error) => {
  console.error('Sports API Error:', error);
  throw error;
};

const EXCLUDED_TERMS = [
    'Manager', 'Coach', 'Assistant', 'Wrestler', 'Boxing', 'Commentator',
    'Gymnastics', 'American Football', 'Rugby', 'Announcer', 'Presenter', 'MMA',
    'Baseball', 'Basketball', 'Ice Hockey', 'Tennis', 'Golf', 'Cycling',
    'Swimming', 'Cricket', 'Volleyball', 'Racing Driver'
];

// Define the top 5 leagues and some popular teams
const TOP_LEAGUES = [
    { 
      country: 'England', 
      league: 'English Premier League', 
      leagueId: 4328,
      badge: 'https://www.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png'
    },
    { 
      country: 'Spain', 
      league: 'Spanish La Liga', 
      leagueId: 4335,
      badge: 'https://www.thesportsdb.com/images/media/league/badge/7onmyv1534768460.png'
    },
    { 
      country: 'Germany', 
      league: 'German Bundesliga', 
      leagueId: 4331,
      badge: 'https://www.thesportsdb.com/images/media/league/badge/0j55yv1534764799.png'
    },
    { 
      country: 'Italy', 
      league: 'Italian Serie A', 
      leagueId: 4332,
      badge: 'https://www.thesportsdb.com/images/media/league/badge/ocy2fe1591122558.png'
    },
    { 
      country: 'France', 
      league: 'French Ligue 1', 
      leagueId: 4334,
      badge: 'https://www.thesportsdb.com/images/media/league/badge/8f5jmf1516458074.png'
    }
  ];

// Cache for storing popular players to minimize API calls
let popularPlayersCache = {};
let teamPlayersCache = {};
let lastSelectedLeague = null;
let lastFetchTime = null;
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

// Check if cache needs refresh
const isCacheValid = () => {
  if (!lastFetchTime) return false;
  return (Date.now() - lastFetchTime) < CACHE_EXPIRY;
};

// Función de filtrado - también va en sportsApiService.js:
const isSoccerPlayer = (player) => {
    if (!player || !player.strPosition) {
      return false;
    }
    
    const position = player.strPosition.toLowerCase();
    for (const excluded of EXCLUDED_TERMS) {
      if (position.includes(excluded.toLowerCase())) {
        return false;
      }
    }
    
    if (player.strSport && player.strSport !== 'Soccer') {
      return false;
    }
    
    return true;
  };

// Function to search players by name with sport filter option
export const searchPlayersByName = async (playerName) => {
    try {
      const searchTerms = [];
      searchTerms.push(playerName);
      
      if (playerName.includes(' ')) {
        const nameParts = playerName.split(' ');
        if (nameParts[0].length > 2) {
          searchTerms.push(nameParts[0]);
        }
        if (nameParts[nameParts.length - 1].length > 2) {
          searchTerms.push(nameParts[nameParts.length - 1]);
        }
      }
      
      const searchPromises = searchTerms.map(term => 
        fetch(`${API_BASE_URL}/${API_KEY}/searchplayers.php?p=${term}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }
            return response.json();
          })
          .then(data => data.player || [])
      );
      
      const resultsArrays = await Promise.all(searchPromises);
      
      let allPlayers = [];
      const playerIds = new Set();
      
      resultsArrays.forEach(players => {
        players.forEach(player => {
          if (!playerIds.has(player.idPlayer) && isSoccerPlayer(player)) {
            playerIds.add(player.idPlayer);
            allPlayers.push(player);
          }
        });
      });
      
      return allPlayers;
    } catch (error) {
      return handleApiError(error);
    }
  };
  

// Get players from a team
export const getTeamPlayers = async (teamId) => {
  // Check cache first
  if (teamPlayersCache[teamId] && isCacheValid()) {
    return teamPlayersCache[teamId];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/lookup_all_players.php?id=${teamId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    const data = await response.json();
    const players = data.player || [];
    
    // Update cache
    teamPlayersCache[teamId] = players;
    lastFetchTime = Date.now();
    
    return players;
  } catch (error) {
    return handleApiError(error);
  }
};

// Get player details by ID
export const getPlayerDetails = async (playerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${API_KEY}/lookupplayer.php?id=${playerId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      const data = await response.json();
      const player = data.players && data.players.length > 0 ? data.players[0] : null;
      
      // Si tenemos el jugador y tiene información del equipo pero no de la liga, tratamos de completarla
      if (player && player.strTeam && !player.strLeagueBadge) {
        try {
          // Buscamos información de la liga por el nombre del equipo
          const teamResults = await searchTeamsByName(player.strTeam);
          if (teamResults && teamResults.length > 0) {
            const team = teamResults[0];
            if (team.strLeague) {
              player.strLeague = team.strLeague;
              
              // Buscamos el badge de la liga en nuestro array de ligas principales
              const leagueInfo = TOP_LEAGUES.find(l => l.league === team.strLeague);
              if (leagueInfo) {
                player.strLeagueBadge = leagueInfo.badge;
                player.leagueId = leagueInfo.leagueId;
              }
            }
          }
        } catch (err) {
          console.error('Error al obtener información adicional de la liga:', err);
          // Continuamos aunque no se pueda obtener la información de la liga
        }
      }
      
      return player;
    } catch (error) {
      return handleApiError(error);
    }
};

// Get popular teams to find popular players from
export const getPopularTeams = async (sport = 'Soccer', country = 'England') => {
  try {
    // For soccer, we'll use English Premier League as it's globally popular
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/search_all_teams.php?s=${sport}&c=${country}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    return handleApiError(error);
  }
};

// Actualizar la función getPopularPlayers para soportar carga paginada con offset
export const getPopularPlayers = async (limit = 20, offset = 0) => {
    // Comprobar si tenemos datos en caché y son válidos (solo si no hay offset)
    if (offset === 0 && Object.keys(popularPlayersCache).length > 0 && isCacheValid()) {
      const allCachedPlayers = Object.values(popularPlayersCache).flat();
      return allCachedPlayers.slice(0, limit);
    }
  
    try {
      // Si es un offset=0, reiniciar la caché, sino mantenerla
      if (offset === 0) {
        popularPlayersCache = {};
      }
      
      // Seleccionar aleatoriamente una de las principales ligas
      // Si tenemos offset, mantener la misma liga para consistencia
      let selectedLeague;
      if (offset > 0 && lastSelectedLeague) {
        selectedLeague = lastSelectedLeague;
      } else {
        const randomLeagueIndex = Math.floor(Math.random() * TOP_LEAGUES.length);
        selectedLeague = TOP_LEAGUES[randomLeagueIndex];
        // Guardar la liga seleccionada para futuras cargas
        lastSelectedLeague = selectedLeague;
      }
      
      console.log(`Obteniendo equipos de ${selectedLeague.league} (offset: ${offset})`);
      
      // Obtener equipos de la liga seleccionada
      const teamsFromLeague = await getTeamsByLeague(selectedLeague.league);
      
      // Si estamos haciendo offset, necesitamos usar equipos diferentes
      // para asegurar que obtenemos jugadores nuevos
      let selectedTeams = [];
      
      // Con offset, tomar equipos diferentes en cada carga
      if (offset > 0) {
        // Calcular cuántos equipos hemos procesado ya (aproximadamente)
        const teamsPerBatch = 5; // Máximo de equipos por carga
        const processedTeams = Math.floor(offset / 30) * teamsPerBatch;
        
        // Tomar los siguientes equipos
        const availableTeams = teamsFromLeague.slice(processedTeams);
        const numberOfTeams = Math.min(teamsPerBatch, availableTeams.length);
        
        // Si ya no hay más equipos, devolver array vacío
        if (availableTeams.length === 0) {
          return [];
        }
        
        // Tomar los siguientes equipos disponibles
        selectedTeams = availableTeams.slice(0, numberOfTeams);
      } else {
        // Si es la primera carga, seleccionar aleatoriamente
        const numberOfTeams = Math.floor(Math.random() * 3) + 3; // Random entre 3-5
        let availableTeams = [...teamsFromLeague];
        
        // Seleccionar aleatoriamente los equipos
        for (let i = 0; i < numberOfTeams && availableTeams.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableTeams.length);
          selectedTeams.push(availableTeams[randomIndex]);
          // Eliminar el equipo seleccionado de los disponibles
          availableTeams.splice(randomIndex, 1);
        }
      }
      
      console.log(`Seleccionados ${selectedTeams.length} equipos para obtener jugadores`);
      
      // Obtener jugadores de los equipos seleccionados
      const playerPromises = selectedTeams.map(team => getTeamPlayers(team.idTeam));
      
      // Procesar todas las promesas
      const playersArrays = await Promise.all(playerPromises);
      
        // Aplanar y recopilar todos los jugadores
        let allPlayers = [];
        playersArrays.forEach((players, index) => {
        if (players && players.length) {
            // Filtrar solo jugadores de fútbol
            const soccerPlayers = players.filter(player => isSoccerPlayer(player));
            
            // Agregar jugadores con información adicional
            const teamName = selectedTeams[index].strTeam;
            const playersWithTeam = soccerPlayers.map(player => ({
            ...player,
            popularityScore: soccerPlayers.length - index,
            teamName,
            strLeague: selectedLeague.league,
            leagueId: selectedLeague.leagueId,
            strLeagueBadge: selectedLeague.badge
            }));
            allPlayers = [...allPlayers, ...playersWithTeam];
        }
        });
      
      // Ordenar por nuestra "puntuación de popularidad" arbitraria y aleatorizar un poco
      allPlayers.sort((a, b) => {
        // Mezcla entre puntuación de popularidad y factor aleatorio para variedad
        return (b.popularityScore * 0.7 + Math.random() * 0.3) - 
               (a.popularityScore * 0.7 + Math.random() * 0.3);
      });
      
      // Si no es offset=0, mantener la caché anterior
      if (offset === 0) {
        popularPlayersCache = {
          soccer: allPlayers
        };
      } else {
        // Añadir los nuevos jugadores a la caché existente
        const existingPlayers = popularPlayersCache.soccer || [];
        popularPlayersCache.soccer = [...existingPlayers, ...allPlayers];
      }
      
      lastFetchTime = Date.now();
      
      return allPlayers.slice(0, limit);
    } catch (error) {
      console.error('Error al obtener jugadores populares:', error);
      return [];
    }
  };

// Search for all leagues in a country
export const getLeaguesByCountry = async (country, sport = null) => {
  try {
    let url = `${API_BASE_URL}/${API_KEY}/search_all_leagues.php?c=${country}`;
    if (sport) {
      url += `&s=${sport}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.countries || [];
  } catch (error) {
    return handleApiError(error);
  }
};

// Get all teams in a league
export const getTeamsByLeague = async (leagueName) => {
  try {
    // URL encode the league name
    const encodedLeagueName = encodeURIComponent(leagueName);
    
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/search_all_teams.php?l=${encodedLeagueName}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    return handleApiError(error);
  }
};

// Search for teams by name
export const searchTeamsByName = async (teamName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${API_KEY}/searchteams.php?t=${teamName}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.teams || [];
  } catch (error) {
    return handleApiError(error);
  }
};

// Utility function to get player thumbnail image URL
export const getPlayerThumbUrl = (player) => {
  if (!player || !player.strThumb) {
    return 'https://www.thesportsdb.com/images/media/player/thumb/defaultplayer.png';
  }
  return player.strThumb;
};

// Utility function to get team badge URL 
export const getTeamBadgeUrl = (team) => {
  if (!team || !team.strTeamBadge) {
    return 'https://www.thesportsdb.com/images/media/team/badge/defaultteam.png';
  }
  return team.strTeamBadge;
};