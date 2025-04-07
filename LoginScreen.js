import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ensures the auth session closes properly
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  // Set up Google Auth directly with Expo
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '602458839279-qu6l9ao2br63uantgd7i1gharne2824a.apps.googleusercontent.com'
  });

  // Watch for response from Google auth
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    try {
      setLoading(true);
      
      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      const userInfo = await userInfoResponse.json();
      
      // Save user info to AsyncStorage
      await AsyncStorage.setItem('@user', JSON.stringify({
        ...userInfo,
        accessToken
      }));
      
      // Call the onLogin callback to update parent component state
      onLogin(userInfo);
      
    } catch (error) {
      console.error("Error getting user info:", error);
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      console.error("Error launching Google sign in:", error);
      alert("Couldn't start login: " + error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerText}>Sports App</Text>
      </View>
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>LOGIN</Text>
        
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Image 
            source={require('./assets/g-logo.png')} 
            style={styles.googleIcon} 
          />
          <Text style={styles.googleText}>Login with Google</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.languageButton}>
          <Text style={styles.languageText}>Español</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modeButton}>
          <Text style={styles.modeText}>Light Mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  loginContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0099DD',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginTop: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  languageButton: {
    backgroundColor: '#CCC',
    padding: 10,
    marginRight: 10,
  },
  languageText: {
    fontSize: 16,
  },
  modeButton: {
    backgroundColor: '#CCC',
    padding: 10,
  },
  modeText: {
    fontSize: 16,
  },
});

export default LoginScreen;