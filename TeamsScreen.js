import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native';
import { useApp } from './AppContext';
import AppHeader from './components/AppHeader';
import { 
  getTeamsByLeague,
  searchTeamsByName,
  getTeamBadgeUrl,
  getTeamEquipment,
  organizeEquipmentBySeason,
  getTeamEvents,
  isEventInPast,
  getEventLineup,           // Actualizado para aceptar nombres de equipos
  organizeLineupByTeam,     // Actualizado
  getPositionInSpanish,
  TOP_LEAGUES
} from './services/sportsApiService';

const { width } = Dimensions.get('window');
const cardWidth = (width / 2) - 25; // 2 cards per row with some margin

const TeamsScreen = () => {
  const { 
    isDarkMode, 
    user, 
    t, 
    navigateTo, 
    language, 
    toggleLanguage, 
    toggleTheme, 
    logout,
    // Funciones de favoritos del contexto
    isTeamInFavorites,
    addTeamToFavorites,
    removeTeamFromFavorites
  } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [error, setError] = useState(null);
  
  // Estado para gestionar ligas y equipos
  const [leagues, setLeagues] = useState(TOP_LEAGUES);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamsData, setTeamsData] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsCache, setTeamsCache] = useState({});
  const teamsPerPage = 6;

  const [jerseyView, setJerseyView] = useState(false);
  const [teamEquipment, setTeamEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonPickerVisible, setSeasonPickerVisible] = useState(false);

  const [eventsView, setEventsView] = useState(false);
  const [teamEvents, setTeamEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventsSeason, setSelectedEventsSeason] = useState(null);
  const [eventSeasonPickerVisible, setEventSeasonPickerVisible] = useState(false);

  const [lineupView, setLineupView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventLineup, setEventLineup] = useState({ homeTeam: [], awayTeam: [] });
  const [loadingLineup, setLoadingLineup] = useState(false);

  // Sidebar menu items
  const sidebarItems = [
    {
      label: t('home'),
      onPress: () => navigateTo('User')
    },
    {
      label: t('watchPlayers'),
      onPress: () => navigateTo('Players')
    },
    {
      label: t('upcomingMatches'),
      onPress: () => navigateTo('UpcomingMatches')
    },
    {
      label: t('watchTeams'),
      onPress: () => navigateTo('Teams')
    }
  ];

  // Header menu items
  const headerMenuItems = [
    {
      label: language === 'en' ? t('spanish') : t('english'),
      onPress: toggleLanguage
    },
    {
      label: isDarkMode ? t('lightMode') : t('darkMode'),
      onPress: toggleTheme
    },
    {
      label: t('logout'),
      onPress: logout
    }
  ];

  // Load leagues on initial mount
  useEffect(() => {
    loadLeagues();
  }, []);

  // Load teams when a league is selected
  useEffect(() => {
    if (selectedLeague) {
      loadTeamsByLeague(selectedLeague.league);
    }
  }, [selectedLeague]);

  // Function to load the top 5 leagues
  const loadLeagues = () => {
    setLeagues(TOP_LEAGUES);
    // Select the first league by default
    if (TOP_LEAGUES.length > 0 && !selectedLeague) {
      setSelectedLeague(TOP_LEAGUES[0]);
    }
  };

  // Function to load teams by league
  const loadTeamsByLeague = async (leagueName) => {
    try {
      setLoading(true);
      setError(null);
      
      const teams = await getTeamsByLeague(leagueName);
      
      // Crear paginación
      const totalPages = Math.ceil(teams.length / teamsPerPage);
      let paginatedCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * teamsPerPage;
        // Añadir información de favoritos a cada equipo
        const teamsWithFavorites = teams.slice(startIndex, startIndex + teamsPerPage).map(team => ({
          ...team,
          isFavorite: isTeamInFavorites(team.idTeam)
        }));
        paginatedCache[i] = teamsWithFavorites;
      }
      
      setTeamsCache(paginatedCache);
      setTeamsData(paginatedCache[1] || []);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error loading teams by league:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  const loadTeamEquipment = async (teamId) => {
    try {
      setLoadingEquipment(true);
      setError(null);
      
      const equipment = await getTeamEquipment(teamId);
      const organizedEquipment = organizeEquipmentBySeason(equipment);
      
      setTeamEquipment(organizedEquipment);
      
      // Seleccionar automáticamente la temporada más reciente
      if (organizedEquipment.length > 0) {
        setSelectedSeason(organizedEquipment[0].season);
      }
      
      setLoadingEquipment(false);
    } catch (error) {
      console.error('Error loading team equipment:', error);
      setError(error.message || t('errorMessage'));
      setLoadingEquipment(false);
    }
  };

  // Handle search query submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to league teams when search is cleared
      if (selectedLeague) {
        setCurrentPage(1);
        setTeamsData(teamsCache[1] || []);
      }
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      const results = await searchTeamsByName(searchQuery);
      
      if (!results || results.length === 0) {
        setSearchResults([]);
        setLoading(false);
        return;
      }
      
      // Add favorite information to results and make sure we have valid data
      const resultsWithFavorites = results
        .filter(team => team && team.idTeam) // Asegurarnos de tener datos válidos
        .map(team => ({
          ...team,
          isFavorite: isTeamInFavorites(team.idTeam)
        }));
      
      // Apply pagination to search results
      const totalPages = Math.ceil(resultsWithFavorites.length / teamsPerPage);
      let searchCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * teamsPerPage;
        searchCache[i] = resultsWithFavorites.slice(startIndex, startIndex + teamsPerPage);
      }
      
      setSearchResults(searchCache[1] || []);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error searching teams:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  const handleSelectTeam = async (team) => {
  setSelectedTeam(team);
  
  // AGREGAR: Limpiar estados de eventos al cambiar de equipo
  setTeamEvents([]);
  setEventsView(false);
  setLineupView(false);
  setSelectedEvent(null);
  setEventLineup({ homeTeam: [], awayTeam: [] });
  
  // Precargar las camisetas y eventos para tenerlas listas
  loadTeamEquipment(team.idTeam);
  loadTeamEvents(team.idTeam);
};

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      // Refresh search results
      await handleSearch();
    } else if (selectedLeague) {
      // Refresh league teams
      await loadTeamsByLeague(selectedLeague.league);
    }
    setRefreshing(false);
  };

  // Navigate to next page
  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    const isSearchMode = searchQuery.trim().length > 0;
    
    if (isSearchMode) {
      if (searchResults[nextPage]) {
        setCurrentPage(nextPage);
        setSearchResults(searchResults[nextPage]);
      }
    } else {
      if (teamsCache[nextPage]) {
        setCurrentPage(nextPage);
        setTeamsData(teamsCache[nextPage]);
      }
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const isSearchMode = searchQuery.trim().length > 0;
      
      if (isSearchMode) {
        setCurrentPage(prevPage);
        setSearchResults(searchResults[prevPage]);
      } else {
        setCurrentPage(prevPage);
        setTeamsData(teamsCache[prevPage]);
      }
    }
  };

  // Toggle a team in favorites
  const toggleFavorite = async (team) => {
    if (!user || !user.id) {
      setError(t('loginToFavorite'));
      return;
    }
  
    if (!team || !team.idTeam) {
      console.error('Intento de añadir un equipo inválido a favoritos');
      setError(t('invalidTeam'));
      return;
    }
  
    try {
      setLoading(true);
      
      // Determinar estado actual
      const isCurrentlyFavorite = isTeamInFavorites(team.idTeam);
      
      let result;
      if (isCurrentlyFavorite) {
        // Remove from favorites
        result = await removeTeamFromFavorites(team.idTeam);
      } else {
        // Add to favorites
        result = await addTeamToFavorites(team);
      }
      
      if (!result.success) {
        throw new Error(result.error || t('errorMessage'));
      }
      
      // Actualizar el estado de favorito en la UI
      const newFavoriteStatus = !isCurrentlyFavorite;
      
      // Actualizar equipo seleccionado si existe
      if (selectedTeam && selectedTeam.idTeam === team.idTeam) {
        setSelectedTeam(prev => ({
          ...prev,
          isFavorite: newFavoriteStatus
        }));
      }
      
      // Determinar si estamos en modo búsqueda o mostrando equipos de la liga
      const isSearchMode = searchQuery.trim().length > 0;
      
      // Actualizar la lista correspondiente
      if (isSearchMode) {
        setSearchResults(prev => 
          prev.map(t => 
            t.idTeam === team.idTeam 
              ? {...t, isFavorite: newFavoriteStatus} 
              : t
          )
        );
      } else {
        setTeamsData(prev => 
          prev.map(t => 
            t.idTeam === team.idTeam 
              ? {...t, isFavorite: newFavoriteStatus} 
              : t
          )
        );
      }
      
      // Actualizar las cachés
      if (isSearchMode) {
        // Si estamos en búsqueda, actualizar la caché de resultados
        Object.keys(searchResults).forEach(pageKey => {
          if (Array.isArray(searchResults[pageKey])) {
            searchResults[pageKey] = searchResults[pageKey].map(t => 
              t.idTeam === team.idTeam 
                ? {...t, isFavorite: newFavoriteStatus} 
                : t
            );
          }
        });
      }
      
      // Siempre actualizar la caché principal de equipos
      setTeamsCache(prevCache => {
        const newCache = {...prevCache};
        
        Object.keys(newCache).forEach(pageKey => {
          if (Array.isArray(newCache[pageKey])) {
            newCache[pageKey] = newCache[pageKey].map(t => 
              t.idTeam === team.idTeam 
                ? {...t, isFavorite: newFavoriteStatus} 
                : t
            );
          }
        });
        
        return newCache;
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating favorites:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Función simplificada para obtener la descripción según el idioma
  const getTeamDescription = (team, language) => {
    // Intentar obtener la descripción en el idioma seleccionado
    if (language === 'es' && team.strDescriptionES) {
      return team.strDescriptionES;
    } else if (team.strDescriptionEN) {
      // Si no hay descripción en el idioma seleccionado, usar la inglesa
      if (language === 'es') {
        return t('noDescriptionInLanguage') + '\n\n' + team.strDescriptionEN;
      }
      return team.strDescriptionEN;
    }
    
    // Si no hay ninguna descripción disponible
    return t('noDescriptionAvailable');
  };

  const getJerseyTypeName = (type) => {
    switch (type) {
      case '1st':
      case 'Home':
        return t('homeKit');
      case '2nd':
        return t('awayKit');
      case '3rd':
        return t('thirdKit');
      case '4th':
        return t('fourthKit');
      case '5th':
        return t('fifthKit');
      default:
        return type;
    }
  };

  // Función para cargar eventos del equipo
  const loadTeamEvents = async (teamId) => {
    try {
      setLoadingEvents(true);
      setError(null);
      
      const events = await getTeamEvents(teamId);
      setTeamEvents(events);
      
      setLoadingEvents(false);
    } catch (error) {
      console.error('Error loading team events:', error);
      setError(error.message || t('errorMessage'));
      setLoadingEvents(false);
    }
  };

  // Función para formatear la fecha
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  // Función para obtener el nombre del tipo de evento
  const getEventTypeName = (type) => {
    // Mapear tipos de eventos si es necesario
    return type || '';
  };

  const loadEventLineup = async (eventId, homeTeamName, awayTeamName) => {
    try {
      setLoadingLineup(true);
      setError(null);
      
      // Pasar los nombres de los equipos para mejorar la clasificación
      const lineup = await getEventLineup(eventId, homeTeamName, awayTeamName);
      setEventLineup(lineup);
      
      setLoadingLineup(false);
    } catch (error) {
      console.error('Error loading event lineup:', error);
      setError(error.message || t('errorMessage'));
      setLoadingLineup(false);
    }
  };

  // Función para manejar la selección de un evento
  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    // Pasar los nombres de los equipos desde el evento
    await loadEventLineup(event.idEvent, event.strHomeTeam, event.strAwayTeam);
    setLineupView(true);
  };
  
  // Render a league item
  const renderLeagueItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.leagueItem,
        selectedLeague && selectedLeague.leagueId === item.leagueId && 
          { borderColor: '#0099DD', borderWidth: 2 },
        { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }
      ]}
      onPress={() => setSelectedLeague(item)}
    >
      {item.badge && (
        <Image 
          source={{ uri: item.badge }} 
          style={styles.leagueBadge}
          resizeMode="contain"
        />
      )}
      <Text style={[
        styles.leagueName,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {item.league}
      </Text>
    </TouchableOpacity>
  );

  // Render a team item
  const renderTeamItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.teamCard,
        { backgroundColor: isDarkMode ? '#444' : '#f0f0f0', width: cardWidth }
      ]}
      onPress={() => handleSelectTeam(item)}
    >
      <Image 
        source={{ uri: getTeamBadgeUrl(item) }} 
        style={styles.teamBadge}
        resizeMode="contain"
      />
      <Text style={[
        styles.teamName,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {item.strTeam}
      </Text>
      
      {item.strLeague && (
        <Text style={[
          styles.teamLeague,
          { color: isDarkMode ? '#ccc' : '#666' }
        ]}>
          {item.strLeague}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.favoriteButton,
          { backgroundColor: item.isFavorite ? '#e74c3c' : '#2ecc71' }
        ]}
        onPress={() => toggleFavorite(item)}
      >
        <Text style={styles.favoriteButtonText}>
          {item.isFavorite ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSeasonEquipment = (jerseyItemBgColor) => {
    if (!selectedSeason) return null;
    
    const seasonData = teamEquipment.find(item => item.season === selectedSeason);
    if (!seasonData) return null;
    
    // Text color based on theme
    const textColor = isDarkMode ? 'white' : 'black';
    
    return (
      <>
        {seasonData.equipment.map((jersey) => (
          <View key={jersey.id} style={[styles.jerseyItem, { backgroundColor: jerseyItemBgColor }]}>
            <Image 
              source={{ uri: jersey.image }} 
              style={styles.jerseyImage}
              resizeMode="contain"
            />
            <Text style={[styles.jerseyName, { color: textColor }]}>
              {getJerseyTypeName(jersey.type)}
            </Text>
          </View>
        ))}
      </>
    );
  };

  // Render team details view
  const renderTeamDetails = () => (
    <ScrollView 
      style={[
        styles.teamDetailsContainer,
        { backgroundColor: isDarkMode ? '#333' : '#fff' }
      ]}
      contentContainerStyle={styles.teamDetailsContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedTeam(null)}
      >
        <Text style={[
          styles.backButtonText,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          ← {t('back')}
        </Text>
      </TouchableOpacity>
      
      <Image 
        source={{ uri: selectedTeam.strBadge || getTeamBadgeUrl(selectedTeam) }} 
        style={styles.teamDetailBadge}
        resizeMode="contain"
      />
      
      <Text style={[
        styles.teamDetailName,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {selectedTeam.strTeam}
      </Text>
      
      <View style={styles.teamDetailActions}>
        <TouchableOpacity
          style={[
            styles.teamDetailAction,
            { backgroundColor: '#0099DD' }
          ]}
          onPress={() => {/* Ver información - Ya está abierto */}}
        >
          <Text style={styles.teamDetailActionText}>
            {t('information')}
          </Text>
        </TouchableOpacity>
        
        {/* BOTÓN Ver eventos */}
        <TouchableOpacity
          style={[
            styles.teamDetailAction,
            { backgroundColor: '#e67e22' }
          ]}
          onPress={() => {
            // CAMBIO: Siempre recargar eventos para el equipo actual
            // Esto asegura que se obtengan los eventos correctos para este equipo
            loadTeamEvents(selectedTeam.idTeam);
            setEventsView(true);
          }}
        >
          <Text style={styles.teamDetailActionText}>
            {t('viewEvents')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.teamDetailAction,
            { backgroundColor: '#666' }
          ]}
          onPress={() => {
            if (teamEquipment.length > 0) {
              setJerseyView(true);
            } else {
              loadTeamEquipment(selectedTeam.idTeam);
              setJerseyView(true);
            }
          }}
        >
          <Text style={styles.teamDetailActionText}>
            {t('viewJerseys')}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.teamDetailInfo}>
        {selectedTeam.strLeague && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('league')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedTeam.strLeague}
            </Text>
          </View>
        )}
        
        {selectedTeam.strStadium && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('stadium')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedTeam.strStadium}
              {selectedTeam.intStadiumCapacity && ` (${selectedTeam.intStadiumCapacity})`}
            </Text>
          </View>
        )}
        
        {selectedTeam.strStadiumLocation && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('location')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedTeam.strStadiumLocation}
            </Text>
          </View>
        )}
        
        {selectedTeam.intFormedYear && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('founded')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedTeam.intFormedYear}
            </Text>
          </View>
        )}
        
        {selectedTeam.strCountry && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('country')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedTeam.strCountry}
            </Text>
          </View>
        )}
        
        {selectedTeam.strWebsite && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('website')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#0099DD' : '#0066CC' }
            ]}>
              {selectedTeam.strWebsite}
            </Text>
          </View>
        )}
      </View>
      
      {(selectedTeam.strDescriptionEN || selectedTeam.strDescriptionES || selectedTeam.strDescriptionIT) && (
        <View style={styles.teamDetailBio}>
          <Text style={[
            styles.bioTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('description')}
          </Text>
          <Text style={[
            styles.bioText,
            { color: isDarkMode ? '#ccc' : '#333' }
          ]}>
            {getTeamDescription(selectedTeam, language)}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.favoriteDetailButton,
          { backgroundColor: selectedTeam.isFavorite ? '#e74c3c' : '#2ecc71' }
        ]}
        onPress={() => toggleFavorite(selectedTeam)}
      >
        <Text style={styles.favoriteDetailButtonText}>
          {selectedTeam.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTeamEvents = () => {
    const textColor = isDarkMode ? 'white' : 'black';
    const borderColor = isDarkMode ? 'white' : 'black';
    const backgroundColor = isDarkMode ? '#333' : '#f5f5f5';
    const headerBackgroundColor = isDarkMode ? '#222' : '#e0e0e0';
    const eventItemBackgroundColor = isDarkMode ? 'rgba(50,50,50,0.6)' : 'rgba(220,220,220,0.6)';
    
    return (
      <View style={[
        styles.container,
        { backgroundColor: backgroundColor}
      ]}>
        {/* Header simplificado - SOLO botón back */}
        <View style={[styles.eventsHeader, { backgroundColor: headerBackgroundColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setEventsView(false)}
          >
            <Text style={[styles.backButtonText, { color: textColor }]}>
              ← {t('back')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Título simplificado */}
        <Text style={[styles.eventsTitle, { color: textColor }]}>
          {t('recentEvents')}
        </Text>
        
        {/* ELIMINAR: seasonSubtitle y todo el modal de selección de temporada */}
        
        {/* Lista de eventos */}
        <ScrollView
          style={styles.eventsScrollView}
          contentContainerStyle={styles.eventsScrollContent}
        >
          {loadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e67e22" />
              <Text style={[styles.loadingText, { color: textColor }]}>
                {t('loading')}
              </Text>
            </View>
          ) : teamEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {teamEvents.map((event, index) => {
                const isPastEvent = isEventInPast(event.dateEvent, event.strTime);
                
                return (
                  <TouchableOpacity
                    key={event.idEvent || index} 
                    style={[
                      styles.eventItem, 
                      { backgroundColor: eventItemBackgroundColor, borderColor:borderColor, borderWidth: 1, borderRadius: 10, padding: 10, flex: 1 }
                    ]}
                    onPress={() => handleSelectEvent(event)}
                  >
                    <Text style={[styles.eventName, { color: textColor }]}>
                      {event.strEvent}
                    </Text>
                    
                    <Text style={[styles.eventLeague, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {event.strLeague}
                    </Text>
                    
                    {/* <View style={styles.eventTeams}>
                      <Text style={[styles.teamName, { color: textColor }]}>
                        {event.strHomeTeam}
                      </Text>
                      <Text style={[styles.vsText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                        {t('vs')}
                      </Text>
                      <Text style={[styles.teamName, { color: textColor }]}>
                        {event.strAwayTeam}
                      </Text>
                    </View> */}
                    
                    <Text style={[styles.eventDate, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {formatEventDate(event.dateEvent)}
                      {event.strTime && ` - ${event.strTime}`}
                    </Text>
                    
                    {isPastEvent && event.intHomeScore !== null && event.intAwayScore !== null && (
                      <Text style={[styles.eventResult, { color: '#e67e22' }]}>
                        {t('result')}: {event.intHomeScore} - {event.intAwayScore}
                      </Text>
                    )}
                    
                    <Text style={[styles.clickHint, { color: isDarkMode ? '#888' : '#999' }]}>
                      {t('viewLineup')} →
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noEventsContainer}>
              <Text style={[styles.noEventsText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                {t('noEventsAvailable')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderEventLineup = () => {
    const textColor = isDarkMode ? 'white' : 'black';
    const backgroundColor = isDarkMode ? '#333' : '#f5f5f5';
    const headerBackgroundColor = isDarkMode ? '#222' : '#e0e0e0';
    const lineupCardBackgroundColor = isDarkMode ? 'rgba(50,50,50,0.6)' : 'rgba(220,220,220,0.6)';
    
    // Función para renderizar una lista de jugadores
    const renderPlayersList = (players, title) => (
      <View style={styles.teamLineupSection}>
        <Text style={[styles.lineupSectionTitle, { color: textColor }]}>
          {title}
        </Text>
        {players.length > 0 ? (
          players.map((player, index) => (
            <View key={player.id || index} style={[
              styles.playerLineupItem,
              { backgroundColor: lineupCardBackgroundColor }
            ]}>
              <Text style={[styles.playerNumber, { color: '#e67e22' }]}>
                {player.number || '--'}
              </Text>
              <Text style={[styles.playerName, { color: textColor }]}>
                {player.name}
              </Text>
              <Text style={[styles.playerPosition, { color: isDarkMode ? '#ccc' : '#666' }]}>
                {language === 'es' ? getPositionInSpanish(player.position) : player.position}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noPlayersText, { color: isDarkMode ? '#ccc' : '#666' }]}>
            {t('noLineupAvailable')}
          </Text>
        )}
      </View>
    );
    
    return (
      <View style={[
        styles.container,
        { backgroundColor: backgroundColor }
      ]}>
        {/* Header */}
        <View style={[styles.lineupHeader, { backgroundColor: headerBackgroundColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setLineupView(false)}
          >
            <Text style={[styles.backButtonText, { color: textColor }]}>
              ← {t('back')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Título del evento */}
        <Text style={[styles.lineupTitle, { color: textColor }]}>
          {selectedEvent?.strEvent}
        </Text>
        
        <Text style={[styles.lineupSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
          {formatEventDate(selectedEvent?.dateEvent)}
          {selectedEvent?.strTime && ` - ${selectedEvent.strTime}`}
        </Text>
        
        {/* Resultado si está disponible */}
        {selectedEvent && isEventInPast(selectedEvent.dateEvent, selectedEvent.strTime) && 
        selectedEvent.intHomeScore !== null && selectedEvent.intAwayScore !== null && (
          <Text style={[styles.lineupResult, { color: '#e67e22' }]}>
            {selectedEvent.strHomeTeam} {selectedEvent.intHomeScore} - {selectedEvent.intAwayScore} {selectedEvent.strAwayTeam}
          </Text>
        )}
        
        {/* Contenido de las alineaciones */}
        <ScrollView
          style={styles.lineupScrollView}
          contentContainerStyle={styles.lineupScrollContent}
        >
          {loadingLineup ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e67e22" />
              <Text style={[styles.loadingText, { color: textColor }]}>
                {t('loading')}
              </Text>
            </View>
          ) : (
            <View style={styles.lineupContainer}>
              {/* Alineación equipo local */}
              <View style={styles.teamLineupContainer}>
                <Text style={[styles.teamLineupTitle, { color: textColor }]}>
                  {selectedEvent?.strHomeTeam}
                </Text>
                
                {eventLineup.homeTeam.starters && (
                  <>
                    {renderPlayersList(eventLineup.homeTeam.starters, t('starters'))}
                    {eventLineup.homeTeam.substitutes.length > 0 && 
                      renderPlayersList(eventLineup.homeTeam.substitutes, t('substitutes'))}
                  </>
                )}
              </View>
              
              {/* Separador */}
              <View style={[styles.lineupSeparator, { backgroundColor: isDarkMode ? '#555' : '#ddd' }]} />
              
              {/* Alineación equipo visitante */}
              <View style={styles.teamLineupContainer}>
                <Text style={[styles.teamLineupTitle, { color: textColor }]}>
                  {selectedEvent?.strAwayTeam}
                </Text>
                
                {eventLineup.awayTeam.starters && (
                  <>
                    {renderPlayersList(eventLineup.awayTeam.starters, t('starters'))}
                    {eventLineup.awayTeam.substitutes.length > 0 && 
                      renderPlayersList(eventLineup.awayTeam.substitutes, t('substitutes'))}
                  </>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderTeamJerseys = () => {
    // Determine colors based on theme mode
    const textColor = isDarkMode ? 'white' : 'black';
    const backgroundColor = isDarkMode ? '#333' : '#f5f5f5';
    const headerBackgroundColor = isDarkMode ? '#222' : '#e0e0e0';
    const jerseyItemBackgroundColor = isDarkMode ? 'rgba(50,50,50,0.6)' : 'rgba(220,220,220,0.6)';
    
    return (
      <View style={[
        styles.container,
        { backgroundColor: backgroundColor }  // Use theme-based background color
      ]}>
        {/* Header with Back button and Season selector */}
        <View style={[styles.jerseyHeader, { backgroundColor: headerBackgroundColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setJerseyView(false)}
          >
            <Text style={[styles.backButtonText, { color: textColor }]}>
              ← {t('back')}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.seasonPickerContainer}>
            <Text style={[styles.seasonLabel, { color: textColor }]}>
              {t('season')}:
            </Text>
            
            <TouchableOpacity 
              style={[styles.seasonSelector, { backgroundColor: '#0099DD' }]}
              onPress={() => setSeasonPickerVisible(true)}
            >
              <Text style={styles.seasonSelectorText}>
                {selectedSeason} 
              </Text>
              <Text style={styles.seasonSelectorIcon}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Title with team name and "Jerseys" */}
        <Text style={[styles.jerseyTitle, { color: textColor }]}>
          {selectedTeam.strTeam} - {t('jerseys')}
        </Text>
        
        {/* Subtitle with season */}
        <Text style={[styles.seasonSubtitle, { color: textColor }]}>
          {t('season')}: {selectedSeason}
        </Text>
        
        {/* Season picker modal */}
        <Modal
          visible={seasonPickerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSeasonPickerVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setSeasonPickerVisible(false)}
          >
            <View style={[
              styles.seasonPickerModal, 
              { backgroundColor: isDarkMode ? '#444' : '#f5f5f5' }
            ]}>
              <ScrollView>
                {teamEquipment.map(item => (
                  <TouchableOpacity
                    key={item.season}
                    style={[
                      styles.seasonPickerItem,
                      selectedSeason === item.season && styles.selectedSeasonItem,
                      { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
                    ]}
                    onPress={() => {
                      setSelectedSeason(item.season);
                      setSeasonPickerVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.seasonPickerItemText,
                      { color: isDarkMode ? 'white' : 'black' },
                      selectedSeason === item.season && styles.selectedSeasonItemText
                    ]}>
                      {item.season}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Main content with jerseys */}
        <ScrollView
          style={styles.jerseyScrollView}
          contentContainerStyle={styles.jerseyScrollContent}
        >
          {loadingEquipment ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0099DD" />
              <Text style={[styles.loadingText, { color: textColor }]}>
                {t('loading')}
              </Text>
            </View>
          ) : teamEquipment.length > 0 ? (
            <View style={styles.jerseyGrid}>
              {/* Pass the jersey item background color to renderSeasonEquipment */}
              {renderSeasonEquipment(jerseyItemBackgroundColor)}
            </View>
          ) : (
            <View style={styles.noJerseysContainer}>
              <Text style={[styles.noJerseysText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                {t('noJerseysAvailable')}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };
  
  // Render pagination controls
  const renderPaginationControls = () => {
    // Determine if we're showing teams or search results
    const isSearchMode = searchQuery.trim().length > 0;
    const currentCache = isSearchMode ? searchResults : teamsCache;
    
    const hasNext = Object.keys(currentCache).length > currentPage;
    const hasPrevious = currentPage > 1;
    
    return (
      <View style={styles.paginationContainer}>
        {hasPrevious ? (
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={goToPreviousPage}
          >
            <Text style={styles.paginationButtonText}>
              ← {t('previous')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paginationPlaceholder} />
        )}
        
        <Text style={[
          styles.pageIndicator,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {currentPage}
        </Text>
        
        {hasNext ? (
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={goToNextPage}
          >
            <Text style={styles.paginationButtonText}>
              {t('next')} →
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paginationPlaceholder} />
        )}
      </View>
    );
  };

  // Render main content
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0099DD" />
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('loading')}
          </Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[
            styles.errorTitle,
            { color: isDarkMode ? '#ff6666' : '#cc0000' }
          ]}>
            {t('error')}
          </Text>
          <Text style={[
            styles.errorMessage,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (selectedLeague && jerseyView) {
                loadTeamEquipment(selectedTeam.idTeam);
              } else if (selectedLeague){
                loadTeamsByLeague(selectedLeague.league);
              } else {
                loadLeagues();
              }
            }}
          >
            <Text style={styles.retryButtonText}>
              {t('tryAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (selectedTeam) {
      // Si estamos viendo alineaciones de un evento
      if (lineupView) {
        return renderEventLineup();
      }
      // Si estamos viendo eventos
      if (eventsView) {
        return renderTeamEvents();
      }
      // Si estamos viendo las camisetas  
      if (jerseyView) {
        return renderTeamJerseys();
      }
      // Si no, mostrar detalles del equipo
      return renderTeamDetails();
    }
    
    const isSearchMode = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.mainContent}>
        {/* Search Bar */}
        <View style={[
          styles.searchContainer,
          { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }
        ]}>
          <TextInput
            style={[
              styles.searchInput,
              { 
                backgroundColor: isDarkMode ? '#222' : '#fff',
                color: isDarkMode ? '#fff' : '#000'
              }
            ]}
            placeholder={t('searchTeams')}
            placeholderTextColor={isDarkMode ? '#999' : '#999'}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text === '') {
                // Reset to league teams when search is cleared
                setCurrentPage(1);
                if (teamsCache[1]) {
                  setTeamsData(teamsCache[1]);
                }
              }
            }}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>
              {t('search')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Leagues Horizontal List (only show when not in search mode) */}
        {!isSearchMode && (
          <View style={styles.leaguesContainer}>
            <Text style={[
              styles.sectionTitle,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {t('leagues')}
            </Text>
            
            <FlatList
              data={leagues}
              renderItem={renderLeagueItem}
              keyExtractor={(item) => item.leagueId.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.leaguesContent}
            />
          </View>
        )}
        
        {/* Teams Grid */}
        <View style={styles.gridContainer}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {isSearchMode ? 
              t('searchResults') : 
              (selectedLeague ? selectedLeague.league : t('popularTeams'))}
          </Text>
          
          <FlatList
            data={isSearchMode ? searchResults : teamsData}
            renderItem={renderTeamItem}
            keyExtractor={(item) => item.idTeam.toString()}
            contentContainerStyle={styles.gridContent}
            numColumns={2}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0099DD']}
                tintColor={isDarkMode ? '#fff' : '#0099DD'}
              />
            }
            ListEmptyComponent={
              <Text style={[
                styles.emptyText,
                { color: isDarkMode ? '#ccc' : '#666' }
              ]}>
                {isSearchMode ? t('noResults') : t('noTeams')}
              </Text>
            }
          />
        </View>
        
        {/* Pagination */}
        {renderPaginationControls()}
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }
    ]}>
      <AppHeader 
        title={t('teams')} 
        sidebarItems={sidebarItems}
        menuItems={headerMenuItems}
      />
      
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  searchButton: {
    backgroundColor: '#0099DD',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Leagues horizontal list
  leaguesContainer: {
    marginVertical: 10,
  },
  leaguesContent: {
    paddingHorizontal: 10,
  },
  leagueItem: {
    width: 130,
    height: 90,
    margin: 5,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBadge: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  leagueName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Teams grid
  gridContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  gridContent: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  teamCard: {
    borderRadius: 10,
    margin: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  teamBadge: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  teamLeague: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  favoriteButton: {
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    color: 'white',
    fontSize: 18,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0099DD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Team details
  teamDetailsContainer: {
    flex: 1,
  },
  teamDetailsContent: {
    padding: 15,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamDetailBadge: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 15,
  },
  teamDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  teamDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  teamDetailAction: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 108,
    alignItems: 'center',
    marginRight: 3
  },
  teamDetailActionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  teamDetailInfo: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
  },
  teamDetailBio: {
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  favoriteDetailButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  favoriteDetailButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  paginationButton: {
    backgroundColor: '#0099DD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    width: 120,
    alignItems: 'center',
  },
  paginationPlaceholder: {
    width: 120,
    height: 35,
  },
  paginationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  jerseyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  backButton: {
    marginBottom: 0, // Para alinear correctamente en el header
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white', // Siempre blanco para la vista de camisetas
  },
  headerSeasonLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonLabel: {
    fontSize: 16,
    marginRight: 10,
    color: 'white', // Siempre blanco para la vista de camisetas
  },
  seasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0099DD',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  seasonSelectorIcon: {
    color: 'white',
    fontSize: 12,
  },
  seasonSelectorBox: {
    backgroundColor: '#0099DD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  seasonSelectorText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  seasonSelectorTriangle: {
    color: 'white',
    fontSize: 12,
  },
  jerseyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    color: 'white',
  },
  seasonSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: 'white',
  },
  jerseyScrollView: {
    flex: 1,
    padding: 10,
  },
  jerseyScrollContent: {
    paddingBottom: 20,
  },
  jerseyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  jerseyItem: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  jerseyImage: {
    width: '100%',
    height: 180,
    marginBottom: 10,
  },
  jerseyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  noJerseysContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noJerseysText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  seasonPickerModal: {
    width: 200,
    maxHeight: 300,
    borderRadius: 8,
    backgroundColor: '#444', // Más oscuro para la vista de camisetas
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  seasonPickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)', // Línea divisoria más clara
  },
  seasonPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seasonPickerItemText: {
    fontSize: 16,
    color: 'white', // Siempre blanco para la vista de camisetas
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  eventsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  eventsScrollView: {
    flex: 1,
    padding: 10,
  },
  eventsScrollContent: {
    paddingBottom: 20,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventLeague: {
    fontSize: 14,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    fontStyle: 'italic',
  },
  eventTeams: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  vsText: {
    fontSize: 14,
    marginHorizontal: 10,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  eventResult: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noEventsText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  clickHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  lineupHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  lineupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
  },
  lineupSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 5,
    paddingHorizontal: 15,
  },
  lineupResult: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  lineupScrollView: {
    flex: 1,
    padding: 10,
  },
  lineupScrollContent: {
    paddingBottom: 20,
  },
  lineupContainer: {
    flex: 1,
  },
  teamLineupContainer: {
    marginBottom: 20,
  },
  teamLineupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  teamLineupSection: {
    marginBottom: 20,
  },
  lineupSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  playerLineupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  playerNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginLeft: 15,
  },
  playerPosition: {
    fontSize: 13,
    fontStyle: 'italic',
    width: 100,
    textAlign: 'right',
  },
  noPlayersText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  lineupSeparator: {
    height: 2,
    marginVertical: 15,
    marginHorizontal: 20,
  },
});

export default TeamsScreen;