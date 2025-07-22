import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  language: 'english' | 'spanish';
  enforcementType: 'police' | 'ice' | 'border';
  notifications: boolean;
  autoSave: boolean;
  theme: 'dark' | 'light';
}

class UserPreferencesManager {
  private static instance: UserPreferencesManager;
  private preferences: UserPreferences;
  private listeners: ((preferences: UserPreferences) => void)[] = [];
  private storageKey = 'legal_guardian_preferences';

  private constructor() {
    // Default preferences
    this.preferences = {
      language: 'english',
      enforcementType: 'police',
      notifications: true,
      autoSave: true,
      theme: 'dark',
    };
    
    this.loadPreferences();
  }

  public static getInstance(): UserPreferencesManager {
    if (!UserPreferencesManager.instance) {
      UserPreferencesManager.instance = new UserPreferencesManager();
    }
    return UserPreferencesManager.instance;
  }

  private async loadPreferences() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }

  private async savePreferences() {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public async updatePreferences(updates: Partial<UserPreferences>) {
    this.preferences = { ...this.preferences, ...updates };
    await this.savePreferences();
    this.notifyListeners();
  }

  public addListener(listener: (preferences: UserPreferences) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (preferences: UserPreferences) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getPreferences()));
  }
}

export default UserPreferencesManager;