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

  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        // Load theme preference
        const savedTheme = await AsyncStorage.getItem('@theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }

        // Load language preference
        const savedLanguage = await AsyncStorage.getItem('@language');
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }

        // Load user data
        const jsonValue = await AsyncStorage.getItem('@user');
        if (jsonValue !== null) {
          setUser(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Error loading saved preferences:", e);
      } finally {
        setLoading(false);
      }
    };

    loadSavedPreferences();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newTheme = isDarkMode ? 'light' : 'dark';
      await AsyncStorage.setItem('@theme', newTheme);
      setIsDarkMode(!isDarkMode);
    } catch (e) {
      console.error("Error saving theme preference:", e);
    }
  };

  // Toggle language function
  const toggleLanguage = async () => {
    try {
      const newLanguage = language === 'en' ? 'es' : 'en';
      await AsyncStorage.setItem('@language', newLanguage);
      setLanguage(newLanguage);
    } catch (e) {
      console.error("Error saving language preference:", e);
    }
  };

  // Login function
  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error("Error saving user data:", e);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
    } catch (e) {
      console.error("Error removing user data:", e);
    }
  };

  // Translation object - expanded with sports-related translations
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
      tryAgain: "Try again with different keywords",
      error: "Error",
      errorMessage: "Something went wrong. Please try again."
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
      tryAgain: "Intenta de nuevo con otras palabras clave",
      error: "Error",
      errorMessage: "Algo salió mal. Por favor, inténtalo de nuevo."
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
    t
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the app context
export const useApp = () => useContext(AppContext);