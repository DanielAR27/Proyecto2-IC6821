import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from './AppContext';
import UserScreen from './UserScreen';
import PlayersScreen from './PlayersScreen';
import TeamsScreen from './TeamsScreen';
import StatisticsScreen from './StatisticsScreen'; 
import LineupScreen from './LineupScreen';


const AppContent = () => {
  const { user, loading, isDarkMode, t, activeScreen, routeParams } = useApp();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#000' }]}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  switch (activeScreen) {
    case 'Players':
      return <PlayersScreen />;
    case 'Teams':
      return <TeamsScreen />;
    case 'Statistics':
      return <StatisticsScreen teamId={routeParams?.teamId} teamName={routeParams?.teamName} />;
    case 'Lineup':
      return (
        <LineupScreen 
          idEvent={routeParams?.idEvent} 
          teamName={routeParams?.teamName} 
          opponentName={routeParams?.opponentName} 
        />
      );
    case 'User':
    default:
      return <UserScreen />;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
  }
});

export default AppContent;
