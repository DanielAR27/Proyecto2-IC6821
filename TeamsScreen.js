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
  getPopularTeams,
  searchTeamsByName,
  getTeamBadgeUrl,
  getTeamsByLeague,
  addFavoriteTeam,
  removeFavoriteTeam
} from './services/sportsApiService';

const TeamsScreen = () => {
  const { isDarkMode, user, t, navigateTo } = useApp();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularTeams, setPopularTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsCache, setTeamsCache] = useState({});
  const teamsPerPage = 6;

  // Sidebar menu items
  const sidebarItems = [
    {
      label: t('home'),
      onPress: () => navigateTo('User')
    },
    {
      label: t('watchPlayers'),
      onPress: () => navigateTo('Players')
    }
  ];

  // Header menu items
  const headerMenuItems = [
    {
      label: t('searchTeams'),
      onPress: () => setSearchQuery('')
    },
    {
      label: t('showFavorites'),
      onPress: () => console.log('Show favorites') // Implement filtering to show only favorites
    }
  ];

  // Load popular teams on initial mount
  useEffect(() => {
    loadPopularTeams();
    // If user data is available, set favorites
    if (user && user.mongodb_data && user.mongodb_data.favorite_teams) {
      setFavorites(user.mongodb_data.favorite_teams);
    }
  }, []);

  // Function to load popular teams with pagination
  const loadPopularTeams = async () => {
    try {
      // If we already have this page in cache, use it
      if (teamsCache[currentPage]) {
        setPopularTeams(teamsCache[currentPage]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Get all teams first
      const allTeamsResult = await getPopularTeams('Soccer', 'England');
      
      // Create pagination
      const allTeams = allTeamsResult || [];
      const totalPages = Math.ceil(allTeams.length / teamsPerPage);
      
      // Prepare teams cache
      let paginatedCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * teamsPerPage;
        paginatedCache[i] = allTeams.slice(startIndex, startIndex + teamsPerPage);
      }
      
      setTeamsCache(paginatedCache);
      setPopularTeams(paginatedCache[currentPage] || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading popular teams:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Handle search query submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await searchTeamsByName(searchQuery);
      
      // Apply pagination to search results
      const totalPages = Math.ceil(results.length / teamsPerPage);
      let searchCache = {};
      
      for (let i = 1; i <= totalPages; i++) {
        const startIndex = (i - 1) * teamsPerPage;
        searchCache[i] = results.slice(startIndex, startIndex + teamsPerPage);
      }
      
      setTeamsCache(searchCache);
      setSearchResults(searchCache[1] || []);
      setCurrentPage(1);
      setLoading(false);
    } catch (error) {
      console.error('Error searching teams:', error);
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
      // Otherwise refresh popular teams
      // Clear cache to force reload
      setTeamsCache({});
      await loadPopularTeams();
    }
    setRefreshing(false);
  };

  // Navigate to next page
  const goToNextPage = () => {
    const nextPage = currentPage + 1;
    const dataSource = searchQuery ? searchResults : popularTeams;
    
    if (teamsCache[nextPage]) {
      setCurrentPage(nextPage);
      if (searchQuery) {
        setSearchResults(teamsCache[nextPage]);
      } else {
        setPopularTeams(teamsCache[nextPage]);
      }
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      
      if (searchQuery) {
        setSearchResults(teamsCache[prevPage]);
      } else {
        setPopularTeams(teamsCache[prevPage]);
      }
    }
  };

  // Handle selecting a team to view details
  const handleSelectTeam = async (team) => {
    setSelectedTeam(team);
  };

  // Check if a team is in favorites
  const isTeamInFavorites = (teamId) => {
    return favorites.some(favTeam => favTeam.team_id === teamId);
  };

  // Toggle a team in favorites
  const toggleFavorite = async (team) => {
    if (!user || !user.id) {
      // Handle not logged in
      setError(t('loginToFavorite'));
      return;
    }

    try {
      setLoading(true);
      
      if (isTeamInFavorites(team.idTeam)) {
        // Remove from favorites
        await removeFavoriteTeam(user.id, team.idTeam);
        // Update local state
        setFavorites(prevFavorites => 
          prevFavorites.filter(fav => fav.team_id !== team.idTeam)
        );
      } else {
        // Add to favorites
        const teamData = {
          team_id: team.idTeam,
          team_name: team.strTeam,
          team_badge: team.strTeamBadge
        };
        
        await addFavoriteTeam(user.id, teamData);
        
        // Update local state
        setFavorites(prevFavorites => [...prevFavorites, teamData]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating favorites:', error);
      setError(error.message || t('errorMessage'));
      setLoading(false);
    }
  };

  // Render a team item in grid
  const renderTeamItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.teamCard,
        { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }
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
          { backgroundColor: isTeamInFavorites(item.idTeam) ? '#e74c3c' : '#2ecc71' }
        ]}
        onPress={() => toggleFavorite(item)}
      >
        <Text style={styles.favoriteButtonText}>
          {isTeamInFavorites(item.idTeam) ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
        source={{ uri: selectedTeam.strTeamBadge || getTeamBadgeUrl(selectedTeam) }} 
        style={styles.teamDetailBadge}
        resizeMode="contain"
      />
      
      <Text style={[
        styles.teamDetailName,
        { color: isDarkMode ? '#fff' : '#000' }
      ]}>
        {selectedTeam.strTeam}
      </Text>
      
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
      </View>
      
      {selectedTeam.strDescriptionEN && (
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
            {selectedTeam.strDescriptionEN}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.favoriteDetailButton,
          { backgroundColor: isTeamInFavorites(selectedTeam.idTeam) ? '#e74c3c' : '#2ecc71' }
        ]}
        onPress={() => toggleFavorite(selectedTeam)}
      >
        <Text style={styles.favoriteDetailButtonText}>
          {isTeamInFavorites(selectedTeam.idTeam) 
            ? t('removeFromFavorites') 
            : t('addToFavorites')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render pagination controls
  const renderPaginationControls = () => {
    const hasNext = teamsCache[currentPage + 1] !== undefined;
    const hasPrevious = currentPage > 1;
    
    return (
      <View style={styles.paginationContainer}>
        {hasPrevious && (
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={goToPreviousPage}
          >
            <Text style={styles.paginationButtonText}>
              ← {t('previous')}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={[
          styles.pageIndicator,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {currentPage}
        </Text>
        
        {hasNext && (
          <TouchableOpacity
            style={styles.paginationButton}
            onPress={goToNextPage}
          >
            <Text style={styles.paginationButtonText}>
              {t('next')} →
            </Text>
          </TouchableOpacity>
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
            onPress={loadPopularTeams}
          >
            <Text style={styles.retryButtonText}>
              {t('tryAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (selectedTeam) {
      return renderTeamDetails();
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
            placeholder={t('searchTeams')}
            placeholderTextColor={isDarkMode ? '#999' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
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
        
        {/* Teams Grid */}
        <View style={styles.gridContainer}>
          <Text style={[
            styles.sectionTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {searchQuery && searchResults.length > 0 
              ? t('searchResults') 
              : t('popularTeams')}
          </Text>
          
          <FlatList
            data={searchQuery && searchResults.length > 0 ? searchResults : popularTeams}
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
                {searchQuery ? t('noResults') : t('noTeams')}
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
  },
  teamCard: {
    flex: 1,
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
    marginBottom: 10,
  },
  favoriteDetailButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationButton: {
    backgroundColor: '#0099DD',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 10,
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

export default TeamsScreen;