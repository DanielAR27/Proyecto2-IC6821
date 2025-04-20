import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
            setUser(JSON.parse(jsonValue));
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
      console.log("User logged out successfully");
    } catch (e) {
      console.error("Error removing user data:", e);
      
      // Force logout even if AsyncStorage fails
      setUser(null);
      
      // Set an error that can be displayed if needed
      setError("Failed to completely clear login data. Please restart the app.");
    }
  };

  // Función para navegar a otra pantalla
  const navigateTo = (screenName) => {
    setActiveScreen(screenName);
    setScreenHistory(prev => [...prev, screenName]);
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
      showFavorites: "Show Favorites"
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
      showFavorites: "Mostrar Favoritos"
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
    goBack
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the app context
export const useApp = () => useContext(AppContext);