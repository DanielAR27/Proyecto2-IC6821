import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from './AppContext';
import { createOrUpdateUser } from './services/apiService';

// Ensures the auth session closes properly
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { isDarkMode, toggleTheme, language, toggleLanguage, login, t } = useApp();

  // Set up Google Auth directly with Expo
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '602458839279-qu6l9ao2br63uantgd7i1gharne2824a.apps.googleusercontent.com',
    // Add iosClientId if you're developing for iOS
  });

  // Watch for response from Google auth
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.accessToken);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      // Handle dismissal or cancellation by resetting loading state
      setLoading(false);
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
      
      // Save user to MongoDB through our backend API
      try {
        const userData = {
          google_id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        };
        
        // Create or update user via API
        const dbUser = await createOrUpdateUser(userData);
        console.log('User saved to database:', dbUser);
        
        // Call the login function from context with the complete info
        login({
          ...userInfo,
          accessToken,
          mongodb_data: dbUser
        });
      } catch (error) {
        console.error('Error saving user to database:', error);
        Alert.alert(
          t('error'),
          t('errorMessage'),
          [{ text: 'OK' }],
          { cancelable: true }
        );
        
        // Still proceed with login even if database save fails
        login({
          ...userInfo,
          accessToken
        });
      }
      
    } catch (error) {
      console.error("Error getting user info:", error);
      Alert.alert(
        t('error'),
        t('errorMessage'),
        [{ text: 'OK' }],
        { cancelable: true }
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      console.error("Error launching Google sign in:", error);
      Alert.alert(
        t('error'),
        "Couldn't start login: " + error.message,
        [{ text: 'OK' }],
        { cancelable: true }
      );
      setLoading(false);
    }
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
      
      <View style={styles.header}>
        <Text style={styles.headerText}>Sports App</Text>
      </View>
      
      <View style={[
        styles.loginContainer, 
        { backgroundColor: isDarkMode ? '#333' : '#fff', 
          borderColor: isDarkMode ? '#555' : '#ddd',
          borderWidth: 1 
        }
      ]}>
        <Text style={[
          styles.loginText, 
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {t('login')}
        </Text>
        
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          <Image 
            source={require('./assets/g-logo.png')} 
            style={styles.googleIcon} 
          />
          <Text style={[
            styles.googleText,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('loginWithGoogle')}
          </Text>
        </TouchableOpacity>

        {loading && (
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {t('loading')}
          </Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.buttonText}>
            {language === 'en' ? t('spanish') : t('english')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.modeButton}
          onPress={toggleTheme}
        >
          <Text style={styles.buttonText}>
            {isDarkMode ? t('lightMode') : t('darkMode')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    width: '100%',
    height: 60,
    backgroundColor: '#0099DD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    marginTop: 0,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    width: '80%',
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
  loadingText: {
    marginTop: 20,
    fontSize: 16,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
  },
  languageButton: {
    backgroundColor: '#0099DD',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  modeButton: {
    backgroundColor: '#0099DD',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default LoginScreen;