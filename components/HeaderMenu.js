import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Pressable 
} from 'react-native';
import { useApp } from '../AppContext';

const HeaderMenu = ({ visible, onClose, items }) => {
  const { isDarkMode } = useApp();

  if (!visible) return null;

  return (
    <Pressable 
      style={styles.menuOverlay}
      onPress={onClose}
    >
      <View style={[
        styles.headerMenu,
        { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
      ]}>
        {items.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.menuButton,
              index === items.length - 1 && styles.lastButton,
              { backgroundColor: isDarkMode ? '#555' : '#cecece' }
            ]} 
            onPress={() => {
              onClose();
              if (item.onPress) item.onPress();
            }}
          >
            <Text style={[
              styles.menuButtonText,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
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
    overflow: 'hidden',
  },
  menuButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  lastButton: {
    borderBottomWidth: 0,
  },
  menuButtonText: {
    fontSize: 16,
  },
});

export default HeaderMenu;