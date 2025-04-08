import * as Realm from 'realm';
import { createRealmContext } from '@realm/react';

// Define schemas for MongoDB objects
const UserSchema = {
  name: 'User',
  primaryKey: 'google_id',
  properties: {
    google_id: 'string',
    name: 'string',
    email: 'string',
    picture: 'string?',
    favorite_players: 'FavoritePlayer[]',
    favorite_teams: 'FavoriteTeam[]',
    last_login: 'date',
    created_at: 'date'
  }
};

const FavoritePlayerSchema = {
  name: 'FavoritePlayer',
  embedded: true,
  properties: {
    player_id: 'string',
    player_name: 'string',
    team_id: 'string?',
    team_name: 'string?'
  }
};

const FavoriteTeamSchema = {
  name: 'FavoriteTeam',
  embedded: true,
  properties: {
    team_id: 'string',
    team_name: 'string'
  }
};

// Create a configuration object
const realmConfig = {
  schema: [UserSchema, FavoritePlayerSchema, FavoriteTeamSchema],
  schemaVersion: 1,
};

// Create a realm context that we can use with the RealmProvider
export const { RealmProvider, useRealm, useObject, useQuery } = createRealmContext(realmConfig);

// Initialize Realm App (get this from MongoDB Atlas App Services dashboard)
export const app = new Realm.App({ id: '67f4ad18f646c116ef999abf' }); // Replace with your App ID

// Function to authenticate anonymously (fallback if Google auth fails)
export const loginAnonymously = async () => {
  try {
    const credentials = Realm.Credentials.anonymous();
    const user = await app.logIn(credentials);
    console.log("Successfully logged in anonymously:", user.id);
    return user;
  } catch (err) {
    console.error("Failed to log in anonymously", err);
    throw err;
  }
};

// Function to authenticate with email/password (can add this later if needed)
export const loginWithEmailPassword = async (email, password) => {
  try {
    const credentials = Realm.Credentials.emailPassword(email, password);
    const user = await app.logIn(credentials);
    console.log("Successfully logged in with email/password:", user.id);
    return user;
  } catch (err) {
    console.error("Failed to log in with email/password", err);
    throw err;
  }
};

// Function to create or update a user in MongoDB
export const createOrUpdateUser = async (realm, userData) => {
  try {
    // Start a write transaction
    realm.write(() => {
      // Create or update the user
      realm.create('User', {
        google_id: userData.google_id,
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
        favorite_players: userData.favorite_players || [],
        favorite_teams: userData.favorite_teams || [],
        last_login: new Date(),
        created_at: userData.created_at || new Date()
      }, Realm.UpdateMode.Modified); // 'Modified' makes this an upsert operation
    });
    
    // Return the user object
    return realm.objectForPrimaryKey('User', userData.google_id);
  } catch (error) {
    console.error('Error saving user to MongoDB:', error);
    throw error;
  }
};

// Function to get user data
export const getUserData = (realm, googleId) => {
  return realm.objectForPrimaryKey('User', googleId);
};

// Function to add a favorite player
export const addFavoritePlayer = (realm, googleId, playerData) => {
  try {
    const user = realm.objectForPrimaryKey('User', googleId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    realm.write(() => {
      user.favorite_players.push({
        player_id: playerData.player_id,
        player_name: playerData.player_name,
        team_id: playerData.team_id,
        team_name: playerData.team_name
      });
    });
    
    return user;
  } catch (error) {
    console.error('Error adding favorite player:', error);
    throw error;
  }
};

// Function to add a favorite team
export const addFavoriteTeam = (realm, googleId, teamData) => {
  try {
    const user = realm.objectForPrimaryKey('User', googleId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    realm.write(() => {
      user.favorite_teams.push({
        team_id: teamData.team_id,
        team_name: teamData.team_name
      });
    });
    
    return user;
  } catch (error) {
    console.error('Error adding favorite team:', error);
    throw error;
  }
};

// Function to remove a favorite player
export const removeFavoritePlayer = (realm, googleId, playerId) => {
  try {
    const user = realm.objectForPrimaryKey('User', googleId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    realm.write(() => {
      // Find the index of the player to remove
      const playerIndex = user.favorite_players.findIndex(
        player => player.player_id === playerId
      );
      
      if (playerIndex !== -1) {
        user.favorite_players.splice(playerIndex, 1);
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error removing favorite player:', error);
    throw error;
  }
};

// Function to remove a favorite team
export const removeFavoriteTeam = (realm, googleId, teamId) => {
  try {
    const user = realm.objectForPrimaryKey('User', googleId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    realm.write(() => {
      // Find the index of the team to remove
      const teamIndex = user.favorite_teams.findIndex(
        team => team.team_id === teamId
      );
      
      if (teamIndex !== -1) {
        user.favorite_teams.splice(teamIndex, 1);
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error removing favorite team:', error);
    throw error;
  }
};