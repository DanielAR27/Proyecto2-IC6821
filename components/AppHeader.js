import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { useApp } from '../AppContext';
import HeaderMenu from './HeaderMenu';
import SidebarMenu from './SideBarMenu';

const AppHeader = ({ title, sidebarItems, menuItems }) => {
  const { isDarkMode } = useApp();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Toggle header menu
  const toggleHeaderMenu = () => {
    setHeaderMenuVisible(!headerMenuVisible);
  };

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="#0099DD" 
      />
      
      {/* Blue app header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={toggleSidebar}
        >
          <Text style={styles.hamburgerIcon}>≡</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerText}>{title}</Text>
        
        <TouchableOpacity 
          style={styles.dotsButton} 
          onPress={toggleHeaderMenu}
        >
          <Text style={styles.dotsIcon}>⋮</Text>
        </TouchableOpacity>
      </View>
      
      {/* Header dropdown menu */}
      <HeaderMenu 
        visible={headerMenuVisible} 
        onClose={() => setHeaderMenuVisible(false)} 
        items={menuItems || []}
      />
      
      {/* Sidebar menu */}
      <SidebarMenu 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        items={sidebarItems || []}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 60,
    backgroundColor: '#0099DD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default AppHeader;