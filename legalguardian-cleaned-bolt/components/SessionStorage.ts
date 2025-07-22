import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SessionData } from '@/components/SessionManager';

/**
 * SessionStorage handles the persistent storage of session data
 * including metadata, recordings, and analysis results.
 */
class SessionStorage {
  private static instance: SessionStorage;
  private readonly STORAGE_KEY = 'legal_guardian_real_sessions';
  private readonly RECORDINGS_DIR: string;

  private constructor() {
    // Initialize recordings directory path safely for SSR
    this.RECORDINGS_DIR = Platform.OS !== 'web' && typeof FileSystem !== 'undefined' && FileSystem.documentDirectory 
      ? `${FileSystem.documentDirectory}recordings/` 
      : '';
    
    // Only initialize storage if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.initializeStorage();
    }
  }

  public static getInstance(): SessionStorage {
    if (!SessionStorage.instance) {
      SessionStorage.instance = new SessionStorage();
    }
    return SessionStorage.instance;
  }

  /**
   * Initialize storage directories
   */
  private async initializeStorage() {
    try {
      // Only perform file system operations on native platforms
      if (Platform.OS !== 'web' && this.RECORDINGS_DIR) {
        const dirInfo = await FileSystem.getInfoAsync(this.RECORDINGS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.RECORDINGS_DIR, { intermediates: true });
        }
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  }

  /**
   * Save a session to persistent storage
   */
  public async saveSession(session: SessionData): Promise<boolean> {
    try {
      // Get existing sessions
      const sessions = await this.getSessions();
      
      // Add new session at the beginning
      sessions.unshift(session);
      
      // Save updated sessions
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      
      console.log(`Session ${session.id} saved successfully`);
      return true;
    } catch (error) {
      console.error('Failed to save session:', error);
      return false;
    }
  }

  /**
   * Get all sessions from storage
   */
  public async getSessions(): Promise<SessionData[]> {
    // Return empty array if we're in SSR
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const sessionsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!sessionsJson) {
        return [];
      }
      
      const sessions = JSON.parse(sessionsJson) as SessionData[];
      
      // Convert date strings back to proper format
      return sessions.map(session => ({
        ...session,
        createdAt: session.createdAt || Date.now(),
      }));
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  /**
   * Update an existing session
   */
  public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<boolean> {
    // Skip if we're in SSR
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      const sessions = await this.getSessions();
      const index = sessions.findIndex(s => s.id === sessionId);
      
      if (index === -1) {
        console.error(`Session ${sessionId} not found`);
        return false;
      }
      
      // Update the session
      sessions[index] = { ...sessions[index], ...updates };
      
      // Save updated sessions
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
      
      console.log(`Session ${sessionId} updated successfully`);
      return true;
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Delete a session and its associated files
   */
  public async deleteSession(sessionId: string): Promise<boolean> {
    // Skip if we're in SSR
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      const sessions = await this.getSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        console.error(`Session ${sessionId} not found`);
        return false;
      }
      
      // Delete associated files if they exist
      if (Platform.OS !== 'web' && this.RECORDINGS_DIR) {
        if (session.audioUrl) {
          try {
            const audioPath = `${this.RECORDINGS_DIR}${sessionId}_audio.m4a`;
            const audioExists = await FileSystem.getInfoAsync(audioPath);
            if (audioExists.exists) {
              await FileSystem.deleteAsync(audioPath);
            }
          } catch (fileError) {
            console.error('Failed to delete audio file:', fileError);
          }
        }
        
        // Delete any other associated files here
      }
      
      // Remove from sessions array
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      
      // Save updated sessions
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSessions));
      
      console.log(`Session ${sessionId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Save audio recording to file system
   */
  public async saveRecordingFile(sessionId: string, uri: string): Promise<string | null> {
    // Skip if we're in SSR or on web
    if (typeof window === 'undefined' || Platform.OS === 'web' || !this.RECORDINGS_DIR) {
      // For web, just return the original URI
      return uri;
    }
    
    try {
      const destinationUri = `${this.RECORDINGS_DIR}${sessionId}_audio.m4a`;
      
      // Copy the recording to our app's documents directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      console.log(`Recording saved to ${destinationUri}`);
      return destinationUri;
    } catch (error) {
      console.error('Failed to save recording file:', error);
      return null;
    }
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  public async clearAllSessions(): Promise<boolean> {
    // Skip if we're in SSR
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      
      // Delete all recording files
      if (Platform.OS !== 'web' && this.RECORDINGS_DIR) {
        try {
          const files = await FileSystem.readDirectoryAsync(this.RECORDINGS_DIR);
          for (const file of files) {
            await FileSystem.deleteAsync(`${this.RECORDINGS_DIR}${file}`);
          }
        } catch (fileError) {
          console.error('Failed to delete recording files:', fileError);
        }
      }
      
      console.log('All sessions cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      return false;
    }
  }
}

export default SessionStorage;