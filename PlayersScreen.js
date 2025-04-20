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
  RefreshControl
} from 'react-native';
import { useApp } from './AppContext';
import AppHeader from './components/AppHeader';
import { 
  getPopularPlayers,
  searchPlayersByName,
  getPlayerDetails,
  getPlayerThumbUrl
} from './services/sportsApiService';

import {
  addFavoritePlayer,
  removeFavoritePlayer
} from './services/apiService';

// Función para obtener la imagen del jugador con fallback
const getPlayerImage = (player) => {
  if (!player || !player.strThumb || player.strThumb === '') {
    return require('./assets/no-photo-small.png');
  }
  return { uri: player.strThumb };
};

// Función para obtener la imagen detallada
const getPlayerDetailImage = (player) => {
  if (!player || !player.strThumb || player.strThumb === '') {
    return require('./assets/no-photo.png');
  }
  return { uri: player.strThumb };
};

const PlayersScreen = () => {
  const { isDarkMode, user, t, navigateTo, language, toggleLanguage, toggleTheme, logout } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularPlayers, setPopularPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  const [searchCache, setSearchCache] = useState({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [playersCache, setPlayersCache] = useState({});
  const playersPerPage = 6;

  // Sidebar menu items
  const sidebarItems = [
    {
      label: t('home'),
      onPress: () => navigateTo('User')
    },
    {
      label: t('watchTeams'),
      onPress: () => navigateTo('Teams')
    }
  ];

  // Header menu items - Actualizado para coincidir con UserScreen
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

  // Load popular players on initial mount
  useEffect(() => {
    loadPopularPlayers();
    if (user && user.mongodb_data && user.mongodb_data.favorite_players) {
      setFavorites(user.mongodb_data.favorite_players);
    }
  }, [user]); 

  // Function to load popular players with pagination
  const loadPopularPlayers = async (offset = 0) => {
    try {
      // Si ya tenemos esta página en caché y no es una carga de más jugadores, úsala
      if (playersCache[currentPage] && offset === 0) {
        setPopularPlayers(playersCache[currentPage]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Obtener más jugadores, usando offset para paginar desde el API
      const allPlayersResult = await getPopularPlayers(30, offset);
      
      // Si es una carga inicial (offset=0), reiniciar la caché
      // Si es una carga adicional (offset>0), añadir a la caché existente
      let allPlayers = [];
      if (offset > 0 && Object.keys(playersCache).length > 0) {
        // Obtener todos los jugadores actuales de la caché
        for (let page in playersCache) {
          allPlayers = [...allPlayers, ...playersCache[page]];
        }
        // Añadir los nuevos jugadores
        allPlayers = [...allPlayers, ...(allPlayersResult || [])];
      } else {
        allPlayers = allPlayersResult || [];
      }
      
      // Crear paginación
      const totalPages = Math.ceil(allPlayers.length / playersPerPage);
      
      // Preparar caché de jugadores
      let paginatedCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * playersPerPage;
        paginatedCache[i] = allPlayers.slice(startIndex, startIndex + playersPerPage);
      }
      
      setPlayersCache(paginatedCache);
      
      // Si es una carga adicional, mantener la página actual
      // Si es una carga inicial, ir a la página 1
      if (offset === 0) {
        setCurrentPage(1);
        setPopularPlayers(paginatedCache[1] || []);
      } else {
        setPopularPlayers(paginatedCache[currentPage] || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading popular players:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Handle search query submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Resetear a jugadores populares cuando se borra la búsqueda
      setSearchResults([]);
      setCurrentPage(1);
      // En lugar de llamar a loadPopularPlayers, restaurar desde caché si existe
      if (Object.keys(playersCache).length === 0) {
        await loadPopularPlayers();
      } else {
        // Usar la caché existente si ya tenemos jugadores populares
        setPopularPlayers(playersCache[1] || []);
      }
      return;
    }
  
    try {
      setLoading(true);
      setError(null);
      const results = await searchPlayersByName(searchQuery);
      
      // Apply pagination to search results
      const totalPages = Math.ceil(results.length / playersPerPage);
      let searchCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * playersPerPage;
        searchCache[i] = results.slice(startIndex, startIndex + playersPerPage);
      }
      
      // Almacenar la caché de búsqueda separada de la caché de jugadores populares
      setSearchCache(searchCache);
      setSearchResults(searchCache[1] || []);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error searching players:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      // If there's a search query, refresh search results
      await handleSearch();
    } else {
      // Otherwise refresh popular players
      // Clear cache to force reload
      setPlayersCache({});
      await loadPopularPlayers();
    }
    setRefreshing(false);
  };
  
  // Navigate to next page
  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    
    // Determine if we're in search mode or popular players mode
    const isSearchMode = searchQuery && searchResults.length > 0;
    const currentCache = isSearchMode ? searchCache : playersCache;
    
    if (currentCache[nextPage]) {
      // Si la siguiente página existe en caché, simplemente navegar a ella
      setCurrentPage(nextPage);
      if (isSearchMode) {
        setSearchResults(currentCache[nextPage]);
      } else {
        setPopularPlayers(currentCache[nextPage]);
      }
    } else {
      // Si estamos en modo de búsqueda y no hay más resultados, simplemente no hacer nada
      if (isSearchMode) {
        return;
      }
      
      // Si estamos en modo de jugadores populares y llegamos al final, cargar más
      // Calcular cuántos jugadores tenemos actualmente para usarlo como offset
      const totalLoadedPlayers = Object.values(playersCache).flat().length;
      loadPopularPlayers(totalLoadedPlayers);
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      
      // Determine if we're in search mode or popular players mode
      const isSearchMode = searchQuery && searchResults.length > 0;
      const currentCache = isSearchMode ? searchCache : playersCache;
      
      if (isSearchMode) {
        setSearchResults(currentCache[prevPage]);
      } else {
        setPopularPlayers(currentCache[prevPage]);
      }
    }
  };

  // Handle selecting a player to view details
  const handleSelectPlayer = async (player) => {
    try {
      setLoading(true);
      setError(null);
      
      // If we need more detailed player info
      const detailedPlayer = await getPlayerDetails(player.idPlayer);
      
      setSelectedPlayer(detailedPlayer || player);
      setLoading(false);
    } catch (error) {
      console.error('Error getting player details:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Check if a player is in favorites
  const isPlayerInFavorites = (playerId) => {
    return favorites.some(favPlayer => favPlayer.player_id === playerId);
  };

  // Toggle a player in favorites - VERSIÓN MEJORADA
  const toggleFavorite = async (player) => {
    if (!user || !user.id) {
      // Handle not logged in
      setError(t('loginToFavorite'));
      return;
    }

    try {
      setLoading(true);
      
      if (isPlayerInFavorites(player.idPlayer)) {
        // Remove from favorites
        await removeFavoritePlayer(user.id, player.idPlayer);
        // Update local state
        setFavorites(prevFavorites => 
          prevFavorites.filter(fav => fav.player_id !== player.idPlayer)
        );
      } else {
        // Add to favorites
        const playerData = {
          player_id: player.idPlayer,
          player_name: player.strPlayer,
          team_name: player.strTeam,
          player_thumb: player.strThumb
        };
        
        await addFavoritePlayer(user.id, playerData);
        
        // Update local state
        setFavorites(prevFavorites => [...prevFavorites, playerData]);
      }
      
      // Actualizar selectedPlayer si es el mismo jugador
      if (selectedPlayer && selectedPlayer.idPlayer === player.idPlayer) {
        setSelectedPlayer({...selectedPlayer});
      }
      
      // Forzar refresco de las listas para que se actualice el estado de favoritos
      if (searchResults.length > 0) {
        setSearchResults([...searchResults]);
      }
      
      if (popularPlayers.length > 0) {
        setPopularPlayers([...popularPlayers]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating favorites:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Render a player item in list
  const renderPlayerItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.playerCard,
        { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }
      ]}
      onPress={() => handleSelectPlayer(item)}
    >
      <Image 
        source={getPlayerImage(item)} 
        style={styles.playerThumb}
        resizeMode="cover"
      />
      <View style={styles.playerInfo}>
        <Text style={[
          styles.playerName,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {item.strPlayer}
        </Text>
        {item.strTeam && (
          <Text style={[
            styles.playerTeam,
            { color: isDarkMode ? '#ccc' : '#666' }
          ]}>
            {item.strTeam}
          </Text>
        )}
        {item.strPosition && (
          <Text style={[
            styles.playerPosition,
            { color: isDarkMode ? '#ccc' : '#666' }
          ]}>
            {item.strPosition}
          </Text>
        )}
        {item.strLeague && (
          <Text style={[
            styles.playerLeague,
            { color: isDarkMode ? '#ccc' : '#666' }
          ]}>
            {item.strLeague}
          </Text>
        )}
      </View>
      <View style={styles.rightContainer}>
        {item.strLeagueBadge && (
          <Image 
            source={{ uri: item.strLeagueBadge }} 
            style={styles.leagueBadge}
            resizeMode="contain"
          />
        )}
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            { backgroundColor: isPlayerInFavorites(item.idPlayer) ? '#e74c3c' : '#2ecc71' }
          ]}
          onPress={() => toggleFavorite(item)}
        >
          <Text style={styles.favoriteButtonText}>
            {isPlayerInFavorites(item.idPlayer) ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render player details view
  const renderPlayerDetails = () => (
    <View style={[
      styles.playerDetailsContainer,
      { backgroundColor: isDarkMode ? '#333' : '#fff' }
    ]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSelectedPlayer(null)}
      >
        <Text style={[
          styles.backButtonText,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          ← {t('back')}
        </Text>
      </TouchableOpacity>
      
      <Image 
        source={getPlayerDetailImage(selectedPlayer)} 
        style={styles.playerDetailImage}
        resizeMode="cover"
      />
      
      <Text style={[
        styles.playerDetailName,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {selectedPlayer.strPlayer}
      </Text>
      
      <View style={styles.playerDetailInfo}>
        {selectedPlayer.strTeam && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('team')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedPlayer.strTeam}
            </Text>
          </View>
        )}
        
        {selectedPlayer.strPosition && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('position')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedPlayer.strPosition}
            </Text>
          </View>
        )}
        
        {selectedPlayer.strNationality && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('nationality')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedPlayer.strNationality}
            </Text>
          </View>
        )}
        
        {selectedPlayer.strHeight && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('height')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedPlayer.strHeight}
            </Text>
          </View>
        )}
        
        {selectedPlayer.strWeight && (
          <View style={styles.detailRow}>
            <Text style={[
              styles.detailLabel,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              {t('weight')}:
            </Text>
            <Text style={[
              styles.detailValue,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {selectedPlayer.strWeight}
            </Text>
          </View>
        )}
        
        {selectedPlayer.strLeague && (
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
              {selectedPlayer.strLeague}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.favoriteDetailButton,
          { backgroundColor: isPlayerInFavorites(selectedPlayer.idPlayer) ? '#e74c3c' : '#2ecc71' }
        ]}
        onPress={() => toggleFavorite(selectedPlayer)}
      >
        <Text style={styles.favoriteDetailButtonText}>
          {isPlayerInFavorites(selectedPlayer.idPlayer) 
            ? t('removeFromFavorites') 
            : t('addToFavorites')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render pagination controls
  const renderPaginationControls = () => {
    const isSearchMode = searchQuery && searchResults.length > 0;
    const currentCache = isSearchMode ? searchCache : playersCache;
    
    // Si estamos en modo de búsqueda, usar la lógica original
    const hasNext = isSearchMode ? currentCache[currentPage + 1] !== undefined : true;
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
            onPress={loadPopularPlayers}
          >
            <Text style={styles.retryButtonText}>
              {t('tryAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (selectedPlayer) {
      return renderPlayerDetails();
    }
    
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
            placeholder={t('searchPlayers')}
            placeholderTextColor={isDarkMode ? '#999' : '#999'}
            value={searchQuery}
            onChangeText={(text) => {
                setSearchQuery(text);
                if (text === '') {
                // Resetear a jugadores populares cuando el texto está vacío
                setSearchQuery('');
                setSearchResults([]);
                setCurrentPage(1);
                if (Object.keys(playersCache).length > 0) {
                    setPopularPlayers(playersCache[1] || []);
                } else {
                    loadPopularPlayers(0);
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
        
        {/* Players List */}
        <View style={styles.listContainer}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {searchQuery && searchResults.length > 0 
              ? t('searchResults') 
              : t('popularPlayers')}
          </Text>
          
          <FlatList
            data={searchQuery && searchResults.length > 0 ? searchResults : popularPlayers}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.idPlayer.toString()}
            contentContainerStyle={styles.listContent}
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
                {searchQuery ? t('noResults') : t('noPlayers')}
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
        title={t('players')} 
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
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  listContent: {
    paddingBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 10,
    alignItems: 'center',
  },
  playerThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerTeam: {
    fontSize: 14,
    marginTop: 2,
  },
  playerPosition: {
    fontSize: 12,
    marginTop: 2,
  },
  playerLeague: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBadge: {
    width: 30,
    height: 30,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
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
  playerDetailsContainer: {
    flex: 1,
    padding: 15,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerDetailImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 15,
  },
  playerDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  playerDetailInfo: {
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
  favoriteDetailButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteDetailButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
    width: 120,  // Ancho fijo para mantener el centrado
    alignItems: 'center',
  },
  paginationPlaceholder: {
    width: 120,  // Debe coincidir con paginationButton
    height: 35,  // Aproximadamente la altura del botón
  },
  paginationButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pageIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlayersScreen;