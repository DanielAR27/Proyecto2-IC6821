import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from './AppContext';
import { createOrUpdateUser } from './services/apiService';

// Ensures the auth session closes properly
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const { isDarkMode, toggleTheme, language, toggleLanguage, login, t } = useApp();
  
  // Add a ref for the authentication timeout
  const authTimeoutRef = useRef(null);

  // Set up Google Auth directly with Expo
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '602458839279-qu6l9ao2br63uantgd7i1gharne2824a.apps.googleusercontent.com',
    // Add iosClientId if you're developing for iOS
  });

  // Watch for response from Google auth
  useEffect(() => {
    if (response?.type === 'success') {
      // Clear timeout if auth is successful
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      handleGoogleResponse(response.authentication.accessToken);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel' || response?.type === 'error') {
      // Clear timeout if auth is cancelled
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      // Handle dismissal or cancellation by resetting loading state
      setLoading(false);
      setLoginError(null); // Clear any error message too
    }
  }, [response]);

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, []);

  const handleGoogleResponse = async (accessToken) => {
    try {
      setLoading(true);
      setLoginError(null);
      
      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      if (!userInfoResponse.ok) {
        throw new Error(`Failed to get user info: ${userInfoResponse.status}`);
      }
      
      const userInfo = await userInfoResponse.json();
      
      // Save user to MongoDB through our backend API
      let dbUser = null;
      let dbError = null;
      
      try {
        const userData = {
          google_id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        };
        
        console.log("Attempting to save user data to backend...");
        dbUser = await createOrUpdateUser(userData);
        console.log('User successfully saved to database');
        
      } catch (error) {
        dbError = error;
        console.error('Error saving user to database:', error);
        
        // Don't show alert here, just store the error
        setLoginError(`Backend error: ${error.message}`);
      }
      
      // Proceed with login regardless of backend success
      login({
        ...userInfo,
        accessToken,
        mongodb_data: dbUser,
        // Flag to indicate if we had database issues
        db_error: dbError ? true : false
      });
      
      // Clear loading state
      setLoading(false);
      
    } catch (error) {
      console.error("Error in Google authentication flow:", error);
      setLoginError(error.message);
      Alert.alert(
        t('error'),
        `${t('errorMessage')}: ${error.message}`,
        [{ text: 'OK' }],
        { cancelable: true }
      );
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setLoginError(null);
      
      // Set a timeout to automatically reset the loading state after 20 seconds
      // This handles cases where the response event might not fire properly
      authTimeoutRef.current = setTimeout(() => {
        console.log("Auth timeout triggered - resetting loading state");
        setLoading(false);
        setLoginError("Authentication timed out. Please try again.");
        authTimeoutRef.current = null;
      }, 20000);
      
      await promptAsync();
    } catch (error) {
      // Clear timeout if there's an error
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      console.error("Error launching Google sign in:", error);
      setLoginError(error.message);
      Alert.alert(
        t('error'),
        `${t('errorMessage')}: ${error.message}`,
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
          style={[
            styles.googleButton,
            loading && styles.disabledButton
          ]}
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
        
        {loginError && (
          <Text style={[
            styles.errorText,
            { color: isDarkMode ? '#ff6666' : '#cc0000' }
          ]}>
            {loginError}
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
  disabledButton: {
    borderColor: '#888',
    opacity: 0.7,
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
    textAlign: 'center',
  },
  errorText: {
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
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
  }
});

export default LoginScreen;