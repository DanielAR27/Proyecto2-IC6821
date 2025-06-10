import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useApp } from "./AppContext";
import {
  getTeamStatistics,
  getTeamLastMatches,
  getTeamNextMatches,
  getTeamBadgeUrl,
  formatEventDate,
  isEventInPast,
} from "./services/sportsApiService";

const { width } = Dimensions.get("window");

const TeamStatisticsScreen = ({ team, onBack }) => {
  const { isDarkMode, t, language } = useApp();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Estados para estadísticas
  const [teamStats, setTeamStats] = useState(null);
  const [lastMatches, setLastMatches] = useState([]);
  const [nextMatches, setNextMatches] = useState([]);
  const [calculatedStats, setCalculatedStats] = useState({
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    matchesPlayed: 0,
  });

  useEffect(() => {
    if (team) {
      loadTeamStatistics();
    }
  }, [team]);

  const loadTeamStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [teamStatsData, lastMatchesData, nextMatchesData] =
        await Promise.all([
          getTeamStatistics(team.idTeam, team.strLeague),
          getTeamLastMatches(team.idTeam, 10), // Últimos 10 partidos para estadísticas
          getTeamNextMatches(team.idTeam, 5), // Próximos 5 partidos
        ]);

      setTeamStats(teamStatsData);
      setLastMatches(lastMatchesData || []);
      setNextMatches(nextMatchesData || []);

      // Calcular estadísticas basadas en los últimos partidos
      if (lastMatchesData && lastMatchesData.length > 0) {
        calculateStatistics(lastMatchesData, team.strTeam);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading team statistics:", error);
      setError(error.message || t("errorMessage"));
      setLoading(false);
    }
  };

  const calculateStatistics = (matches, teamName) => {
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let matchesPlayed = 0;

    matches.forEach((match) => {
      // Solo contar partidos ya jugados con resultado
      if (
        isEventInPast(match.dateEvent, match.strTime) &&
        match.intHomeScore !== null &&
        match.intAwayScore !== null
      ) {
        matchesPlayed++;

        const homeScore = parseInt(match.intHomeScore) || 0;
        const awayScore = parseInt(match.intAwayScore) || 0;

        // Determinar si el equipo jugó como local o visitante
        const isHomeTeam = match.strHomeTeam === teamName;

        if (isHomeTeam) {
          goalsFor += homeScore;
          goalsAgainst += awayScore;

          if (homeScore > awayScore) {
            wins++;
          } else if (homeScore === awayScore) {
            draws++;
          } else {
            losses++;
          }
        } else {
          goalsFor += awayScore;
          goalsAgainst += homeScore;

          if (awayScore > homeScore) {
            wins++;
          } else if (awayScore === homeScore) {
            draws++;
          } else {
            losses++;
          }
        }
      }
    });

    const goalDifference = goalsFor - goalsAgainst;

    setCalculatedStats({
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference,
      matchesPlayed,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTeamStatistics();
    setRefreshing(false);
  };

  const formatMatchDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const renderStatCard = (title, value, color = "#0099DD") => (
    <View
      style={[
        styles.statCard,
        { backgroundColor: isDarkMode ? "#444" : "#f0f0f0" },
      ]}
    >
      <Text style={[styles.statTitle, { color: isDarkMode ? "#ccc" : "#666" }]}>
        {title}
      </Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const renderMatchItem = ({ item, isNext = false }) => {
    const isPast = isEventInPast(item.dateEvent, item.strTime);
    const teamIsHome = item.strHomeTeam === team.strTeam;

    return (
      <View
        style={[
          styles.matchCard,
          { backgroundColor: isDarkMode ? "#444" : "#f0f0f0" },
        ]}
      >
        <View style={styles.matchHeader}>
          <Text
            style={[styles.matchDate, { color: isDarkMode ? "#ccc" : "#666" }]}
          >
            {formatMatchDate(item.dateEvent)}
            {item.strTime && ` - ${item.strTime}`}
          </Text>
          {item.strLeague && (
            <Text
              style={[
                styles.matchLeague,
                { color: isDarkMode ? "#888" : "#999" },
              ]}
            >
              {item.strLeague}
            </Text>
          )}
        </View>

        <View style={styles.matchTeams}>
          <View style={styles.teamSection}>
            <Text
              style={[
                styles.teamName,
                { color: isDarkMode ? "#fff" : "#000" },
                teamIsHome && styles.highlightedTeam,
              ]}
            >
              {item.strHomeTeam}
            </Text>
          </View>

          <View style={styles.scoreSection}>
            {isPast &&
            item.intHomeScore !== null &&
            item.intAwayScore !== null ? (
              <Text style={[styles.score, { color: "#e67e22" }]}>
                {item.intHomeScore} - {item.intAwayScore}
              </Text>
            ) : (
              <Text
                style={[styles.vsText, { color: isDarkMode ? "#ccc" : "#666" }]}
              >
                {t("vs")}
              </Text>
            )}
          </View>

          <View style={styles.teamSection}>
            <Text
              style={[
                styles.teamName,
                { color: isDarkMode ? "#fff" : "#000" },
                !teamIsHome && styles.highlightedTeam,
              ]}
            >
              {item.strAwayTeam}
            </Text>
          </View>
        </View>

        {item.strVenue && (
          <Text style={[styles.venue, { color: isDarkMode ? "#888" : "#999" }]}>
            📍 {item.strVenue}
          </Text>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0099DD" />
          <Text
            style={[
              styles.loadingText,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {t("loading")}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text
            style={[
              styles.errorTitle,
              { color: isDarkMode ? "#ff6666" : "#cc0000" },
            ]}
          >
            {t("error")}
          </Text>
          <Text
            style={[
              styles.errorMessage,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadTeamStatistics}
          >
            <Text style={styles.retryButtonText}>{t("tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0099DD"]}
            tintColor={isDarkMode ? "#fff" : "#0099DD"}
          />
        }
      >
        {/* Header del equipo */}
        <View style={styles.teamHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onBack) {
                onBack();
              }
            }}
          >
            <Text
              style={[
                styles.backButtonText,
                { color: isDarkMode ? "#fff" : "#000" },
              ]}
            >
              ← {t("back")}
            </Text>
          </TouchableOpacity>

          <View style={styles.teamInfo}>
            <Image
              source={{ uri: getTeamBadgeUrl(team) }}
              style={styles.teamBadge}
              resizeMode="contain"
            />
            <Text
              style={[styles.teamName, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {team.strTeam}
            </Text>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDarkMode ? "#ccc" : "#666" },
              ]}
            >
              {t("teamStatistics")}
            </Text>
          </View>
        </View>

        {/* Estadísticas calculadas */}
        <View style={styles.statsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {t("statistics")} ({calculatedStats.matchesPlayed}{" "}
            {t("lastMatches").toLowerCase()})
          </Text>

          <View style={styles.statsGrid}>
            {renderStatCard(t("wins"), calculatedStats.wins, "#2ecc71")}
            {renderStatCard(t("draws"), calculatedStats.draws, "#f39c12")}
            {renderStatCard(t("losses"), calculatedStats.losses, "#e74c3c")}
            {renderStatCard(t("goalsFor"), calculatedStats.goalsFor, "#3498db")}
            {renderStatCard(
              t("goalsAgainst"),
              calculatedStats.goalsAgainst,
              "#e67e22"
            )}
            {renderStatCard(
              t("goalDifference"),
              calculatedStats.goalDifference > 0
                ? `+${calculatedStats.goalDifference}`
                : calculatedStats.goalDifference,
              calculatedStats.goalDifference > 0
                ? "#2ecc71"
                : calculatedStats.goalDifference < 0
                ? "#e74c3c"
                : "#95a5a6"
            )}
          </View>
        </View>

        {/* Próximos partidos */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {t("nextMatches")}
          </Text>

          {nextMatches.length > 0 ? (
            <FlatList
              data={nextMatches}
              renderItem={({ item }) => renderMatchItem({ item, isNext: true })}
              keyExtractor={(item) =>
                item.idEvent?.toString() || Math.random().toString()
              }
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDarkMode ? "#ccc" : "#666" },
                ]}
              >
                {t("noNextMatches")}
              </Text>
            </View>
          )}
        </View>

        {/* Últimos partidos */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            {t("lastMatches")}
          </Text>

          {lastMatches.length > 0 ? (
            <FlatList
              data={lastMatches.slice(0, 5)} // Mostrar solo los 5 más recientes
              renderItem={({ item }) =>
                renderMatchItem({ item, isNext: false })
              }
              keyExtractor={(item) =>
                item.idEvent?.toString() || Math.random().toString()
              }
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text
                style={[
                  styles.emptyText,
                  { color: isDarkMode ? "#ccc" : "#666" },
                ]}
              >
                {t("noResults")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" },
      ]}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  teamHeader: {
    padding: 20,
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  teamInfo: {
    alignItems: "center",
  },
  teamBadge: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  teamName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  statCard: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  statTitle: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  matchCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  matchDate: {
    fontSize: 14,
    fontWeight: "500",
  },
  matchLeague: {
    fontSize: 12,
    fontStyle: "italic",
  },
  matchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  teamSection: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  highlightedTeam: {
    fontWeight: "bold",
    color: "#0099DD",
  },
  scoreSection: {
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  vsText: {
    fontSize: 14,
    textAlign: "center",
  },
  venue: {
    fontSize: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#0099DD",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default TeamStatisticsScreen;
