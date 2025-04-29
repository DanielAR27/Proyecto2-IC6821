import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from './AppContext';
import { getTeamStatistics } from './services/statisticsService';

export default function StatisticsScreen() {
  const { isDarkMode, goBack, routeParams } = useApp();
  const { teamId, teamName } = routeParams || {};  // AQUÍ usamos el parámetro guardado

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatistics() {
      if (!teamId) {
        setLoading(false);
        return;
      }
      const data = await getTeamStatistics(teamId);
      setStats(data);
      setLoading(false);
    }

    fetchStatistics();
  }, [teamId]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
        <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>
          No se pudieron cargar las estadísticas.
        </Text>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#fff' }]}>
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>
        {teamName ? `Estadísticas de ${teamName}` : 'Estadísticas'}
      </Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Partidos Jugados: {stats.played}</Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Victorias: {stats.wins}</Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Empates: {stats.draws}</Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Derrotas: {stats.losses}</Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Goles a Favor: {stats.goalsFor}</Text>
      <Text style={[styles.item, { color: isDarkMode ? '#fff' : '#000' }]}>Goles en Contra: {stats.goalsAgainst}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    fontSize: 18,
    marginVertical: 6,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#0099DD',
  },
});
