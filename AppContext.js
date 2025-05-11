import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  addFavoritePlayer, 
  removeFavoritePlayer,
  addFavoriteTeam,
  removeFavoriteTeam,
} from './services/apiService';

// Create context
export const AppContext = createContext();

// Create provider component
export const AppProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default is dark mode
  const [language, setLanguage] = useState('es'); // Default is Spanish
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para la navegación
  const [activeScreen, setActiveScreen] = useState('User');
  const [screenHistory, setScreenHistory] = useState(['User']);
  const [routeParams, setRouteParams] = useState(null);

  
  // Estado global para favoritos
  const [favoritePlayers, setFavoritePlayers] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState([]);

  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load theme preference
        try {
          const savedTheme = await AsyncStorage.getItem('@theme');
          if (savedTheme !== null) {
            setIsDarkMode(savedTheme === 'dark');
          }
        } catch (e) {
          console.warn("Error loading theme preference:", e);
          // Continue with default theme
        }

        // Load language preference
        try {
          const savedLanguage = await AsyncStorage.getItem('@language');
          if (savedLanguage !== null) {
            setLanguage(savedLanguage);
          }
        } catch (e) {
          console.warn("Error loading language preference:", e);
          // Continue with default language
        }

        // Load user data
        try {
          const jsonValue = await AsyncStorage.getItem('@user');
          if (jsonValue !== null) {
            const userData = JSON.parse(jsonValue);
            setUser(userData);
            
            // Inicializar favoritos desde los datos del usuario
            if (userData.mongodb_data) {
              if (userData.mongodb_data.favorite_players) {
                setFavoritePlayers(userData.mongodb_data.favorite_players);
              }
              if (userData.mongodb_data.favorite_teams) {
                setFavoriteTeams(userData.mongodb_data.favorite_teams);
              }
            }
          }
        } catch (e) {
          console.error("Error loading user data:", e);
          setError("Failed to load user data. You may need to log in again.");
        }
      } catch (e) {
        console.error("Error in loadSavedPreferences:", e);
        setError("An error occurred while loading app preferences.");
      } finally {
        setLoading(false);
      }
    };

    loadSavedPreferences();
  }, []);

  // Toggle theme function with error handling
  const toggleTheme = async () => {
    try {
      const newTheme = isDarkMode ? 'light' : 'dark';
      await AsyncStorage.setItem('@theme', newTheme);
      setIsDarkMode(!isDarkMode);
    } catch (e) {
      console.error("Error saving theme preference:", e);
      // Still toggle the theme in memory even if saving fails
      setIsDarkMode(!isDarkMode);
    }
  };

  // Toggle language function with error handling
  const toggleLanguage = async () => {
    try {
      const newLanguage = language === 'en' ? 'es' : 'en';
      await AsyncStorage.setItem('@language', newLanguage);
      setLanguage(newLanguage);
    } catch (e) {
      console.error("Error saving language preference:", e);
      // Still toggle the language in memory even if saving fails
      setLanguage(language === 'en' ? 'es' : 'en');
    }
  };

  // Login function with better error handling
  const login = async (userData) => {
    try {
      if (!userData) {
        throw new Error("No user data provided");
      }
      
      // Log login attempt, but hide sensitive info
      console.log(`Login attempt for user: ${userData.name}, ID: ${userData.id}`);
      
      // Store the user data
      const jsonValue = JSON.stringify(userData);
      await AsyncStorage.setItem('@user', jsonValue);
      setUser(userData);
      
      // Inicializar favoritos desde los datos del usuario
      if (userData.mongodb_data) {
        if (userData.mongodb_data.favorite_players) {
          setFavoritePlayers(userData.mongodb_data.favorite_players);
        }
        if (userData.mongodb_data.favorite_teams) {
          setFavoriteTeams(userData.mongodb_data.favorite_teams);
        }
      }
      
      // Clear any existing error
      setError(null);
      
      console.log("User logged in successfully");
    } catch (e) {
      console.error("Error saving user data:", e);
      
      // Set the user in memory even if AsyncStorage fails
      // This lets the app work for the current session
      setUser(userData);
      
      // Set an error that can be displayed if needed
      setError("Failed to save login information. Your login may not persist after closing the app.");
    }
  };

  // Logout function with error handling
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
      // Limpiar favoritos al cerrar sesión
      setFavoritePlayers([]);
      setFavoriteTeams([]);
      console.log("User logged out successfully");
    } catch (e) {
      console.error("Error removing user data:", e);
      
      // Force logout even if AsyncStorage fails
      setUser(null);
      setFavoritePlayers([]);
      setFavoriteTeams([]);
      
      // Set an error that can be displayed if needed
      setError("Failed to completely clear login data. Please restart the app.");
    }
  };

  // Función para navegar a otra pantalla

  const navigateTo = (screenName, params = null) => {
    setActiveScreen(screenName);
    setScreenHistory(prev => [...prev, screenName]);
    setRouteParams(params); // Guardar los parámetros
  };
  

  // Función para volver a la pantalla anterior
  const goBack = () => {
    if (screenHistory.length > 1) {
      // Elimina la pantalla actual y obtiene la anterior
      const newHistory = [...screenHistory];
      newHistory.pop();
      const previousScreen = newHistory[newHistory.length - 1];
      
      setActiveScreen(previousScreen);
      setScreenHistory(newHistory);
    }
  };

  // Nuevas funciones para gestionar favoritos
  const addPlayerToFavorites = async (player) => {
    if (!user || !user.id) {
      setError(t('loginToFavorite'));
      return { success: false, error: 'No user logged in' };
    }

    try {
      const playerData = {
        player_id: player.idPlayer,
        player_name: player.strPlayer,
        team_name: player.strTeam,
        player_thumb: player.strThumb
      };

      // Llamar a la API para guardar en la base de datos
      const result = await addFavoritePlayer(user.id, playerData);
      
      // Actualizar el estado local
      setFavoritePlayers(prev => [...prev, playerData]);
      
      // Actualizar también los datos del usuario en memoria
      if (user && user.mongodb_data) {
        const updatedUser = {
          ...user,
          mongodb_data: {
            ...user.mongodb_data,
            favorite_players: [...(user.mongodb_data.favorite_players || []), playerData]
          }
        };
        setUser(updatedUser);
        
        // Actualizar AsyncStorage
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error adding player to favorites:', error);
      setError(error.message || t('errorMessage'));
      return { success: false, error: error.message };
    }
  };

  const removePlayerFromFavorites = async (playerId) => {
    if (!user || !user.id) {
      setError(t('loginToFavorite'));
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Llamar a la API para eliminar de la base de datos
      const result = await removeFavoritePlayer(user.id, playerId);
      
      // Actualizar el estado local
      setFavoritePlayers(prev => prev.filter(player => player.player_id !== playerId));
      
      // Actualizar también los datos del usuario en memoria
      if (user && user.mongodb_data) {
        const updatedUser = {
          ...user,
          mongodb_data: {
            ...user.mongodb_data,
            favorite_players: (user.mongodb_data.favorite_players || []).filter(
              player => player.player_id !== playerId
            )
          }
        };
        setUser(updatedUser);
        
        // Actualizar AsyncStorage
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error removing player from favorites:', error);
      setError(error.message || t('errorMessage'));
      return { success: false, error: error.message };
    }
  };

  const addTeamToFavorites = async (team) => {
    if (!user || !user.id) {
      setError(t('loginToFavorite'));
      return { success: false, error: 'No user logged in' };
    }

    try {
      const teamData = {
        team_id: team.idTeam,
        team_name: team.strTeam,
        team_badge: team.strTeamBadge
      };

      // Llamar a la API para guardar en la base de datos
      const result = await addFavoriteTeam(user.id, teamData);
      
      // Actualizar el estado local
      setFavoriteTeams(prev => [...prev, teamData]);
      
      // Actualizar también los datos del usuario en memoria
      if (user && user.mongodb_data) {
        const updatedUser = {
          ...user,
          mongodb_data: {
            ...user.mongodb_data,
            favorite_teams: [...(user.mongodb_data.favorite_teams || []), teamData]
          }
        };
        setUser(updatedUser);
        
        // Actualizar AsyncStorage
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error adding team to favorites:', error);
      setError(error.message || t('errorMessage'));
      return { success: false, error: error.message };
    }
  };

  const removeTeamFromFavorites = async (teamId) => {
    if (!user || !user.id) {
      setError(t('loginToFavorite'));
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Llamar a la API para eliminar de la base de datos
      const result = await removeFavoriteTeam(user.id, teamId);
      
      // Actualizar el estado local
      setFavoriteTeams(prev => prev.filter(team => team.team_id !== teamId));
      
      // Actualizar también los datos del usuario en memoria
      if (user && user.mongodb_data) {
        const updatedUser = {
          ...user,
          mongodb_data: {
            ...user.mongodb_data,
            favorite_teams: (user.mongodb_data.favorite_teams || []).filter(
              team => team.team_id !== teamId
            )
          }
        };
        setUser(updatedUser);
        
        // Actualizar AsyncStorage
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error removing team from favorites:', error);
      setError(error.message || t('errorMessage'));
      return { success: false, error: error.message };
    }
  };

  // Función para verificar si un jugador está en favoritos
  const isPlayerInFavorites = (playerId) => {
    return favoritePlayers.some(player => player.player_id === playerId);
  };

  // Función para verificar si un equipo está en favoritos
  const isTeamInFavorites = (teamId) => {
    return favoriteTeams.some(team => team.team_id === teamId);
  };

// Actualización de las traducciones en AppContext.js

// Translation object - expanded with sports-related translations and error messages
const translations = {
  en: {
    login: "LOGIN",
    loginWithGoogle: "Login with Google",
    welcome: "Welcome",
    logout: "Logout",
    loading: "Loading...",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    spanish: "Spanish",
    english: "English",
    yourIdIs: "Your ID is",
    watchPlayers: "Watch Players",
    watchTeams: "Watch Teams",
    menu: "Menu",
    favoritePlayers: "Favorite Players",
    favoriteTeams: "Favorite Teams",
    upcomingMatches: "Upcoming Matches",
    noFavoritePlayers: "You haven't added any favorite players yet",
    noFavoriteTeams: "You haven't added any favorite teams yet",
    noUpcomingMatches: "No upcoming matches found",
    searchPlayers: "Search Players",
    searchTeams: "Search Teams",
    addToFavorites: "Add to Favorites",
    removeFromFavorites: "Remove from Favorites",
    position: "Position",
    nationality: "Nationality",
    league: "League",
    leagues: "Leagues", // Nuevo
    team: "Team",
    height: "Height",
    weight: "Weight",
    founded: "Founded",
    stadium: "Stadium",
    location: "Location",
    website: "Website",
    description: "Description",
    search: "Search",
    homeTeam: "Home",
    awayTeam: "Away",
    date: "Date",
    time: "Time",
    venue: "Venue",
    noResults: "No results found",
    tryAgain: "Try again",
    error: "Error",
    errorMessage: "Something went wrong. Please try again.",
    databaseError: "Cannot connect to the database. Your favorite players and teams might not be available.",
    networkError: "Network error. Please check your internet connection.",
    loginError: "Login error. Please try again.",
    retry: "Retry",
    connectionError: "Connection error",
    serverError: "Server error",
    skip: "Skip",
    continue: "Continue",
    // Nuevas claves para Players y Teams
    players: "Players",
    teams: "Teams",
    home: "Home",
    previous: "Previous",
    next: "Next",
    searchResults: "Search Results",
    popularPlayers: "Popular Players",
    popularTeams: "Popular Teams",
    noPlayers: "No players found",
    noTeams: "No teams found",
    back: "Back",
    loginToFavorite: "Please log in to add favorites",
    searchPlayers: "Search Players",
    searchTeams: "Search Teams",
    showFavorites: "Show Favorites",
    viewLastLineup: "View Last Lineup",
    //Para statistics
    // En "en"
    viewStatistics: "View Statistics",

    // En "es"
    viewStatistics: "Ver Estadísticas",

    // Nuevas traducciones para TeamsScreen
    information: "Information",
    viewJerseys: "View Jerseys",
    country: "Country",
    noDescriptionInLanguage: "No description available in your selected language. Here is the information in English:",
    noDescriptionAvailable: "No description available for this team.",
    invalidTeam: "Invalid team data",
    homeKit: "Home Kit",
    awayKit: "Away Kit",
    thirdKit: "Third Kit",
    fourthKit: "Fourth Kit",
    fifthKit: "Fifth Kit",
    jerseys: "Jerseys",
    noJerseysAvailable: "No jerseys available.",
    season: "Season"
  },
  es: {
    login: "INICIAR SESIÓN",
    loginWithGoogle: "Iniciar con Google",
    welcome: "Bienvenido",
    logout: "Cerrar sesión",
    loading: "Cargando...",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    spanish: "Español",
    english: "Inglés",
    yourIdIs: "Tu ID es",
    watchPlayers: "Ver Jugadores",
    watchTeams: "Ver Equipos",
    menu: "Menú",
    favoritePlayers: "Jugadores Favoritos",
    favoriteTeams: "Equipos Favoritos",
    upcomingMatches: "Próximos Partidos",
    noFavoritePlayers: "Aún no has añadido jugadores favoritos",
    noFavoriteTeams: "Aún no has añadido equipos favoritos",
    noUpcomingMatches: "No se encontraron próximos partidos",
    searchPlayers: "Buscar Jugadores",
    searchTeams: "Buscar Equipos",
    addToFavorites: "Añadir a Favoritos",
    removeFromFavorites: "Quitar de Favoritos",
    position: "Posición",
    nationality: "Nacionalidad",
    league: "Liga",
    leagues: "Ligas", // Nuevo
    team: "Equipo",
    height: "Altura",
    weight: "Peso",
    founded: "Fundado",
    stadium: "Estadio",
    location: "Ubicación",
    website: "Sitio Web",
    description: "Descripción",
    search: "Buscar",
    homeTeam: "Local",
    awayTeam: "Visitante",
    date: "Fecha",
    time: "Hora",
    venue: "Lugar",
    noResults: "No se encontraron resultados",
    tryAgain: "Intentar de nuevo",
    error: "Error",
    errorMessage: "Algo salió mal. Por favor, inténtalo de nuevo.",
    databaseError: "No se puede conectar a la base de datos. Es posible que tus jugadores y equipos favoritos no estén disponibles.",
    networkError: "Error de red. Por favor, verifica tu conexión a internet.",
    loginError: "Error de inicio de sesión. Por favor, inténtalo de nuevo.",
    retry: "Reintentar",
    connectionError: "Error de conexión",
    serverError: "Error del servidor",
    skip: "Omitir",
    continue: "Continuar",
    // Nuevas claves para Players y Teams
    players: "Jugadores",
    teams: "Equipos",
    home: "Inicio",
    previous: "Anterior",
    next: "Siguiente",
    searchResults: "Resultados de Búsqueda",
    popularPlayers: "Jugadores Populares",
    popularTeams: "Equipos Populares",
    noPlayers: "No se encontraron jugadores",
    noTeams: "No se encontraron equipos",
    back: "Volver",
    loginToFavorite: "Inicia sesión para añadir favoritos",
    searchPlayers: "Buscar Jugadores",
    searchTeams: "Buscar Equipos",
    showFavorites: "Mostrar Favoritos",
    
    // Nuevas traducciones para TeamsScreen
    information: "Información",
    viewJerseys: "Ver Camisetas",
    country: "País",
    noDescriptionInLanguage: "No hay información disponible en el idioma seleccionado. Aquí está la información en inglés:",
    noDescriptionAvailable: "No hay descripción disponible para este equipo.",
    invalidTeam: "Datos de equipo inválidos",
    homeKit: "Camiseta Titular",
    awayKit: "Camiseta Visitante",
    thirdKit: "Tercera Camiseta",
    fourthKit: "Cuarta Camiseta",
    fifthKit: "Quinta Camiseta",
    jerseys: "Camisetas",
    noJerseysAvailable: "No hay camisetas disponibles.",
    season: "Temporada",
    viewLastLineup: "Ver última alineación"


  }
};

  // Get text based on current language
  const t = (key) => {
    return translations[language][key] || key;
  };

  const contextValue = {
    isDarkMode,
    toggleTheme,
    language,
    toggleLanguage,
    user,
    login,
    logout,
    loading,
    error,
    setError,
    t,
    // Navegación
    activeScreen,
    navigateTo,
    goBack,
    routeParams,
    // Favoritos
    favoritePlayers,
    favoriteTeams,
    addPlayerToFavorites,
    removePlayerFromFavorites,
    addTeamToFavorites,
    removeTeamFromFavorites,
    isPlayerInFavorites,
    isTeamInFavorites
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the app context
export const useApp = () => useContext(AppContext);