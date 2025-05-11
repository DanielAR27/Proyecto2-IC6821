import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useApp } from './AppContext';

const LineupScreen = ({ idEvent, teamName, opponentName }) => {
  const { t, isDarkMode, goBack } = useApp();
  const [startingLineup, setStartingLineup] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLineup = async () => {
      try {
        const response = await axios.get(`https://www.thesportsdb.com/api/v1/json/680723/lookuplineup.php?id=${idEvent}`);
        setStartingLineup(response.data.lineup || []);
      } catch (error) {
        console.error('Error fetching lineup:', error);
        setStartingLineup([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLineup();
  }, [idEvent]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0099DD" />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', marginTop: 10 }}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botón para volver */}
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={[styles.backButtonText, { color: '#000' }]}>← {t('back')}</Text>
      </TouchableOpacity>

      {/* Encabezados */}
      <Text style={[styles.header, { color: '#000' }]}>
        Alineación del último partido – {teamName}
      </Text>

      {/* Lista de jugadores */}
      {/* Jugadores del equipo seleccionado */}
      {startingLineup
        .filter(p => p.strTeam === teamName)
        .map((player) => (
          <View key={player.idPlayer} style={[styles.playerRow, { backgroundColor: isDarkMode ? '#222' : '#eee' }]}>
            <Image
              source={{ uri: player.strCutout || 'https://www.thesportsdb.com/images/media/player/thumb/defaultplayer.png' }}
              style={styles.playerImage}
            />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: isDarkMode ? '#fff' : '#000' }]}>{player.strPlayer}</Text>
              <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>{player.strPosition}</Text>
            </View>
          </View>
        ))}

      {/* Texto del rival */}
      <Text style={[styles.rivalHeader, { color: isDarkMode ? '#000' : '#000' }]}>
        Rival: {opponentName}
      </Text>

      {/* Jugadores del rival */}
      {startingLineup
        .filter(p => p.strTeam === opponentName)
        .map((player) => (
          <View key={player.idPlayer} style={[styles.playerRow, { backgroundColor: isDarkMode ? '#222' : '#eee' }]}>
            <Image
              source={{ uri: player.strCutout || 'https://www.thesportsdb.com/images/media/player/thumb/defaultplayer.png' }}
              style={styles.playerImage}
            />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: isDarkMode ? '#fff' : '#000' }]}>{player.strPlayer}</Text>
              <Text style={{ color: isDarkMode ? '#ccc' : '#333' }}>{player.strPosition}</Text>
            </View>
          </View>
        ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rivalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
  },  
  subHeader: {
    fontSize: 16,
    marginBottom: 15,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  playerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  playerInfo: {
    flexDirection: 'column',
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LineupScreen;
