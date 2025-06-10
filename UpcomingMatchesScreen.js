import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useApp } from './AppContext';
import AppHeader from './components/AppHeader';
import { getUpcomingMatchesByLeague } from './services/sportsApiService';
import { ScrollView } from 'react-native';
const UpcomingMatchesScreen = () => {
  const {
    isDarkMode,
    t,
    navigateTo,
    language,
    toggleLanguage,
    toggleTheme,
    logout,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(4328); // Premier League ID por defecto

  // Lista de ligas disponibles
  const leagues = [
    { id: 4328, name: 'Premier League' },
    { id: 4335, name: 'La Liga' },
    { id: 4331, name: 'Serie A' },
    { id: 4332, name: 'Bundesliga' },
    { id: 4334, name: 'Ligue 1' },
    { id: 4815, name: 'Costa Rica' },
  ];

  // Sidebar menu items
  const sidebarItems = [
    {
      label: t('home'),
      onPress: () => navigateTo('User'),
    },
    {
      label: t('watchPlayers'),
      onPress: () => navigateTo('Players'),
    },
    {
      label: t('watchTeams'),
      onPress: () => navigateTo('Teams'),
    },
  ];

  // Header menu items
  const headerMenuItems = [
    {
      label: language === 'en' ? t('spanish') : t('english'),
      onPress: toggleLanguage,
    },
    {
      label: isDarkMode ? t('lightMode') : t('darkMode'),
      onPress: toggleTheme,
    },
    {
      label: t('logout'),
      onPress: logout,
    },
  ];

  // Fetch matches by league
  const fetchMatches = async (leagueId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUpcomingMatchesByLeague(leagueId);
      setMatches(data);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(t('errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  // Load matches when the league changes
  useEffect(() => {
    fetchMatches(selectedLeague);
  }, [selectedLeague]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMatches(selectedLeague);
    setRefreshing(false);
  };

  // Render a match item
  const renderMatchItem = ({ item }) => (
    <View style={[styles.matchItem, { backgroundColor: isDarkMode ? '#444' : '#f0f0f0' }]}>
      <Image source={{ uri: item.strHomeTeamBadge }} style={styles.teamBadge} />
      <Text style={[styles.matchText, { color: isDarkMode ? '#fff' : '#000' }]}>
        {item.strHomeTeam} vs {item.strAwayTeam}
      </Text>
      <Image source={{ uri: item.strAwayTeamBadge }} style={styles.teamBadge} />
      <Text style={[styles.matchDate, { color: isDarkMode ? '#ccc' : '#666' }]}>
        {item.dateEvent} - {item.strTime}
      </Text>
    </View>
  );

  // Render league selector
  // Render league selector
const renderLeagueSelector = () => (
  <View style={styles.leagueSelectorContainer}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.leagueSelector}
    >
      {leagues.map((league) => (
        <TouchableOpacity
          key={league.id}
          style={[
            styles.leagueButton,
            selectedLeague === league.id && { borderColor: '#0099DD', borderWidth: 2 },
          ]}
          onPress={() => setSelectedLeague(league.id)}
        >
          <Text style={[styles.leagueButtonText, { color: isDarkMode ? '#fff' : '#000' }]}>
            {league.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0099DD" />
        <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: isDarkMode ? '#ff6666' : '#cc0000' }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <AppHeader title={t('upcomingMatches')} sidebarItems={sidebarItems} menuItems={headerMenuItems} />
      {renderLeagueSelector()}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.idEvent.toString()}
        renderItem={renderMatchItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0099DD']}
            tintColor={isDarkMode ? '#fff' : '#0099DD'}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorText: {
    fontSize: 18,
    textAlign: 'center',
  },
  leagueSelectorContainer: {
    paddingVertical: 10,
    backgroundColor: '#e0e0e0',
  },
  leagueSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  leagueButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  leagueButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContent: {
    padding: 10,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  matchText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  matchDate: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  teamBadge: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
});
export default UpcomingMatchesScreen;