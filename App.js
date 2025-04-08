import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LoginScreen from './LoginScreen';
import UserScreen from './UserScreen';
import { AppProvider, useApp } from './AppContext';

// Main App component that uses context
const MainApp = () => {
  const { user, loading, isDarkMode, t } = useApp();

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
    return <LoginScreen />;
  }

  // User is logged in, show user screen
  return <UserScreen />;
};

// Root component that provides App context
export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

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