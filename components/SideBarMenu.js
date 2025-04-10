import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { useApp } from '../AppContext';

const SidebarMenu = ({ visible, onClose, items }) => {
  const { isDarkMode, t } = useApp();
  const [sidebarAnimation] = useState(new Animated.Value(-300));

  // Handle animation when visibility changes
  useEffect(() => {
    if (visible) {
      // Open sidebar with animation
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      }).start();
    } else {
      // Close sidebar with animation
      Animated.timing(sidebarAnimation, {
        toValue: -300,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  }, [visible, sidebarAnimation]);

  // Render menu items
  const renderMenuItems = () => {
    return items.map((item, index) => (
      <TouchableOpacity 
        key={index} 
        style={styles.sidebarItem}
        onPress={() => {
          onClose();
          if (item.onPress) item.onPress();
        }}
      >
        <Text style={[
          styles.sidebarItemText,
          { color: isDarkMode ? '#fff' : '#000' }
        ]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View 
              style={[
                styles.sidebar,
                { 
                  left: sidebarAnimation,
                  backgroundColor: isDarkMode ? '#333' : '#f0f0f0'
                }
              ]}
            >
              <View style={styles.sidebarHeader}>
                <Text style={[
                  styles.sidebarTitle,
                  { color: isDarkMode ? '#fff' : '#000' }
                ]}>
                  {t('menu')}
                </Text>
              </View>
              
              {renderMenuItems()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    width: '70%',
    height: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sidebarItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sidebarItemText: {
    fontSize: 16,
  },
});

export default SidebarMenu;