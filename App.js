import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import LoginScreen from './LoginScreen';

// Ensures the auth session closes properly
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored user data on app start
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@user');
        if (jsonValue != null) {
          setUser(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error("Error reading user from storage:", e);
      } finally {
        setLoading(false);
      }
    };

    checkStoredUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user is logged in, show login screen
  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  // User is logged in, show home screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sports App</Text>
      </View>
      
      <View style={styles.profileContainer}>
        <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
        {user.picture && (
          <Image 
            source={{ uri: user.picture }} 
            style={styles.profilePic} 
          />
        )}
        <Text style={styles.emailText}>{user.email}</Text>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 50,
  },
  header: {
    width: '100%',
    height: 60,
    backgroundColor: '#0099DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    width: '80%',
    marginTop: 40,
    borderRadius: 10,
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#0099DD',
    padding: 10,
    borderRadius: 5,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
  },
});