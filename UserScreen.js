import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { useApp } from './AppContext';
import { getUserByGoogleId } from './services/apiService';
import AppHeader from './components/AppHeader';

const UserScreen = () => {
  const { isDarkMode, toggleTheme, language, toggleLanguage, user, logout, t, navigateTo } = useApp();
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Sidebar menu items
  const sidebarItems = [
    {
      label: t('watchPlayers'),
      onPress: () => navigateTo('Players')
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

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching user data for Google ID: ${user.id}`);
        const dbUser = await getUserByGoogleId(user.id);
        console.log('User data fetched successfully');
        
        setMongoUser(dbUser);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message || t('errorMessage'));
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, retryCount]);

  // Function to retry loading user data
  const handleRetry = () => {
    setRetryCount(prevCount => prevCount + 1);
  };

  // Render favorite players section
  const renderFavoritePlayers = () => {
    if (!mongoUser) return null;
    
    return (
      <>
        <Text style={[
          styles.sectionTitle, 
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {t('favoritePlayers')}
        </Text>
        
        {mongoUser.favorite_players && mongoUser.favorite_players.length > 0 ? (
          mongoUser.favorite_players.map((player, index) => (
            <View 
              key={player.player_id || index} 
              style={[
                styles.favoriteItem,
                { backgroundColor: isDarkMode ? '#444' : '#e8e8e8' }
              ]}
            >
              <Text style={[
                styles.favoriteItemTitle,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {player.player_name}
              </Text>
              {player.team_name && (
                <Text style={[
                  styles.favoriteItemSubtitle,
                  { color: isDarkMode ? '#ccc' : '#555' }
                ]}>
                  {player.team_name}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[
            styles.noFavoritesText,
            { color: isDarkMode ? '#ccc' : '#555' }
          ]}>
            {t('noFavoritePlayers')}
          </Text>
        )}
      </>
    );
  };
  
  // Render favorite teams section
  const renderFavoriteTeams = () => {
    if (!mongoUser) return null;
    
    return (
      <>
        <Text style={[
          styles.sectionTitle, 
          { color: isDarkMode ? '#fff' : '#000', marginTop: 20 }
        ]}>
          {t('favoriteTeams')}
        </Text>
        
        {mongoUser.favorite_teams && mongoUser.favorite_teams.length > 0 ? (
          mongoUser.favorite_teams.map((team, index) => (
            <View 
              key={team.team_id || index} 
              style={[
                styles.favoriteItem,
                { backgroundColor: isDarkMode ? '#444' : '#e8e8e8' }
              ]}
            >
              <Text style={[
                styles.favoriteItemTitle,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {team.team_name}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[
            styles.noFavoritesText,
            { color: isDarkMode ? '#ccc' : '#555' }
          ]}>
            {t('noFavoriteTeams')}
          </Text>
        )}
      </>
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
            { color: isDarkMode ? '#fff' : '#000', marginTop: 15 }
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
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>
              {t('tryAgain')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <>
        <View style={[
          styles.contentContainer, 
          { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
        ]}>
          <Text style={[
            styles.welcomeText, 
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('welcome')}, {user?.name}!
          </Text>
        </View>
        
        {/* Favorites section */}
        {mongoUser && (
          <View style={[
            styles.favoritesContainer, 
            { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
          ]}>
            {renderFavoritePlayers()}
            {renderFavoriteTeams()}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      {/* Use our reusable AppHeader component */}
      <AppHeader 
        title="Sports App" 
        sidebarItems={sidebarItems}
        menuItems={headerMenuItems}
      />
      
      {/* Main content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 30,
    minHeight: '85%',
  },
  contentContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Loading container
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    width: '100%',
  },
  // Error container
  errorContainer: {
    width: '80%',
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
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
  // Favorites section
  favoritesContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  favoriteItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  favoriteItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  favoriteItemSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  noFavoritesText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default UserScreen;