export const fetchUpcomingMatches = async () => {
    try {
      const response = await fetch('http://192.168.x.x:5001/api/matches/upcoming'); // Reemplaza con la IP de tu servidor
      if (!response.ok) {
        throw new Error('Error al obtener los partidos');
      }
      const matches = await response.json();
      return matches;
    } catch (error) {
      console.error('Error al obtener los partidos:', error);
      return [];
    }
  };