import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useApp } from './AppContext';
import UserScreen from './UserScreen';
import PlayersScreen from './PlayersScreen';
import TeamsScreen from './TeamsScreen';

const AppContent = () => {
  const { user, loading, isDarkMode, t, activeScreen } = useApp();

  // Show loading state
  if (loading) {
    return (
      <View style={[
        styles.container, 
        { backgroundColor: isDarkMode ? '#000' : '#fff' }
      ]}>
        <Text style={[
          styles.loadingText,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  // If no user is logged in, show login screen
  if (!user) {
    return null; // El LoginScreen lo manejará App.js
  }

  // Render la pantalla correspondiente según el estado activeScreen
  switch (activeScreen) {
    case 'Players':
      return <PlayersScreen />;
    case 'Teams':
      return <TeamsScreen />;
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