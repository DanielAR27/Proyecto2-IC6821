import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  StatusBar, 
  Modal, 
  TouchableWithoutFeedback,
  Animated,
  Pressable,
  ScrollView,
  Alert
} from 'react-native';
import { useApp } from './AppContext';
import { getUserByGoogleId, getTeamNextEvents } from './services/apiService';

const UserScreen = () => {
  const { isDarkMode, toggleTheme, language, toggleLanguage, user, logout, t } = useApp();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [mongoUser, setMongoUser] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Animation value for sidebar
  const [sidebarAnimation] = useState(new Animated.Value(-300));

  // Fetch user data and upcoming matches
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user && user.id) {
          setLoading(true);
          // Get user data from our backend API
          const dbUser = await getUserByGoogleId(user.id);
          setMongoUser(dbUser);
          
          // If user has favorite players, fetch upcoming matches for their team
          if (dbUser && dbUser.favorite_players && dbUser.favorite_players.length > 0) {
            const playerData = dbUser.favorite_players[0];
            if (playerData.team_id) {
              const matches = await getTeamNextEvents(playerData.team_id);
              setUpcomingMatches(matches.slice(0, 3)); // Get first 3 matches
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert(
          t('error'),
          t('errorMessage'),
          [{ text: 'OK' }],
          { cancelable: true }
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  // Toggle sidebar
  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Close sidebar with animation
      Animated.timing(sidebarAnimation, {
        toValue: -300,
        duration: 300,
        useNativeDriver: false
      }).start(() => {
        setSidebarVisible(false);
      });
    } else {
      // Open sidebar with animation
      setSidebarVisible(true);
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  };

  // Toggle header menu
  const toggleHeaderMenu = () => {
    setHeaderMenuVisible(!headerMenuVisible);
  };

  // Render upcoming matches
  const renderUpcomingMatches = () => {
    if (upcomingMatches.length === 0) {
      return (
        <Text style={[
          styles.noMatchesText,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {t('noUpcomingMatches')}
        </Text>
      );
    }
    
    return upcomingMatches.map((match, index) => (
      <View 
        key={match.idEvent || index} 
        style={[
          styles.matchCard,
          { backgroundColor: isDarkMode ? '#444' : '#e8e8e8' }
        ]}
      >
        <Text style={[
          styles.matchTitle,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {match.strEvent}
        </Text>
        <Text style={[
          styles.matchDate,
          { color: isDarkMode ? '#ccc' : '#555' }
        ]}>
          {new Date(match.dateEvent).toLocaleDateString()} - {match.strTime || 'TBD'}
        </Text>
        <Text style={[
          styles.matchVenue,
          { color: isDarkMode ? '#ccc' : '#555' }
        ]}>
          {match.strVenue}
        </Text>
      </View>
    ));
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="#0099DD" 
      />
      
      {/* Header with hamburger and dropdown menus */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={toggleSidebar}
        >
          <Text style={styles.hamburgerIcon}>≡</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerText}>Sports App</Text>
        
        <TouchableOpacity 
          style={styles.dotsButton} 
          onPress={toggleHeaderMenu}
        >
          <Text style={styles.dotsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
          
          <Text style={[
            styles.idText, 
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('yourIdIs')}: {user?.id}
          </Text>
        </View>
        
        {/* Favorites section */}
        {mongoUser && (
          <View style={[
            styles.favoritesContainer, 
            { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
          ]}>
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
          </View>
        )}
        
        {/* Upcoming matches section */}
        {mongoUser && mongoUser.favorite_players && mongoUser.favorite_players.length > 0 && (
          <View style={[
            styles.matchesContainer, 
            { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
          ]}>
            <Text style={[
              styles.sectionTitle, 
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {t('upcomingMatches')} 
              {mongoUser.favorite_players[0]?.player_name && 
                ` - ${mongoUser.favorite_players[0].player_name}`}
            </Text>
            
            {loading ? (
              <Text style={[
                styles.loadingText,
                { color: isDarkMode ? '#ccc' : '#555' }
              ]}>
                {t('loading')}...
              </Text>
            ) : (
              renderUpcomingMatches()
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Pressable overlay for closing menu when clicking outside */}
      {headerMenuVisible && (
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setHeaderMenuVisible(false)}
        >
          {/* This pressable overlay covers the entire screen */}
          <View style={[
            styles.headerMenu,
            { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
          ]}>
            <TouchableOpacity 
              style={[
                styles.menuButton,
                { backgroundColor: isDarkMode ? '#555' : '#cecece' }
              ]} 
              onPress={() => {
                toggleLanguage();
                setHeaderMenuVisible(false);
              }}
            >
              <Text style={[
                styles.menuButtonText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {language === 'en' ? t('spanish') : t('english')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.menuButton,
                { backgroundColor: isDarkMode ? '#555' : '#cecece' }
              ]} 
              onPress={() => {
                toggleTheme();
                setHeaderMenuVisible(false);
              }}
            >
              <Text style={[
                styles.menuButtonText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {isDarkMode ? t('lightMode') : t('darkMode')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.menuButton, 
                styles.logoutButton,
                { backgroundColor: isDarkMode ? '#555' : '#cecece' }
              ]}
              onPress={() => {
                logout();
                setHeaderMenuVisible(false);
              }}
            >
              <Text style={[
                styles.menuButtonText,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {t('logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}
      
      {/* Sidebar modal overlay */}
      <Modal
        transparent={true}
        visible={sidebarVisible}
        animationType="none"
        onRequestClose={toggleSidebar}
      >
        <TouchableWithoutFeedback onPress={toggleSidebar}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View 
                style={[
                  styles.sidebar,
                  { 
                    left: sidebarAnimation,
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0'
                  }
                ]}
              >
                <View style={styles.sidebarHeader}>
                  <Text style={[
                    styles.sidebarTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    {t('menu')}
                  </Text>
                </View>
                
                <TouchableOpacity style={styles.sidebarItem}>
                  <Text style={[
                    styles.sidebarItemText,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    {t('watchPlayers')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sidebarItem}>
                  <Text style={[
                    styles.sidebarItemText,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    {t('watchTeams')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  header: {
    width: '100%',
    height: 60,
    backgroundColor: '#0099DD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 0,
    marginTop: 0,
    paddingHorizontal: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hamburgerButton: {
    padding: 5,
  },
  hamburgerIcon: {
    color: 'white',
    fontSize: 24,
  },
  dotsButton: {
    padding: 5,
  },
  dotsIcon: {
    color: 'white',
    fontSize: 24,
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 30,
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
  idText: {
    fontSize: 18,
    marginTop: 10,
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
  // Matches section
  matchesContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    marginTop: 20,
  },
  matchCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchDate: {
    fontSize: 14,
    marginTop: 5,
  },
  matchVenue: {
    fontSize: 14,
    marginTop: 5,
  },
  noMatchesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Overlay for capturing touches outside the menu
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  // Header dropdown menu styles
  headerMenu: {
    position: 'absolute',
    top: 60,
    right: 10,
    width: 150,
    borderRadius: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  menuButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuButtonText: {
    fontSize: 16,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  // Sidebar styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: '70%',
    height: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sidebarItemText: {
    fontSize: 16,
  },
});

export default UserScreen;