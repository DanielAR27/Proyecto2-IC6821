// API service for communicating with the backend

const API_BASE_URL = 'https://sports-app-backend-1jbf.onrender.com/api';

// Function to handle API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  throw error;
};

// User API functions

// Get user by Google ID
export const getUserByGoogleId = async (googleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${googleId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// Create or update user
export const createOrUpdateUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// Add a player to favorites
export const addFavoritePlayer = async (googleId, playerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${googleId}/players`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(playerData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// Add a team to favorites
export const addFavoriteTeam = async (googleId, teamData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${googleId}/teams`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// Remove a player from favorites
export const removeFavoritePlayer = async (googleId, playerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${googleId}/players/${playerId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};

// Remove a team from favorites
export const removeFavoriteTeam = async (googleId, teamId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${googleId}/teams/${teamId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    return handleApiError(error);
  }
};