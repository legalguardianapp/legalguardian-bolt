export interface Translations {
  [key: string]: {
    english: string;
    spanish: string;
  };
}

const translations: Translations = {
  // App Title
  appTitle: {
    english: 'LEGAL GUARDIAN',
    spanish: 'GUARDIÁN LEGAL'
  },
  
  // Navigation
  home: {
    english: 'Home',
    spanish: 'Inicio'
  },
  recording: {
    english: 'Recording',
    spanish: 'Grabación'
  },
  history: {
    english: 'History',
    spanish: 'Historial'
  },
  settings: {
    english: 'Settings',
    spanish: 'Ajustes'
  },
  
  // Recording Screen
  startRecording: {
    english: 'START LEGAL PROTECTION',
    spanish: 'INICIAR PROTECCIÓN LEGAL'
  },
  stopRecording: {
    english: 'STOP RECORDING',
    spanish: 'DETENER GRABACIÓN'
  },
  recording: {
    english: 'RECORDING',
    spanish: 'GRABANDO'
  },
  
  // History Screen
  sessionHistory: {
    english: 'SESSION HISTORY',
    spanish: 'HISTORIAL DE SESIONES'
  },
  noSessions: {
    english: 'NO SESSIONS YET',
    spanish: 'AÚN NO HAY SESIONES'
  },
  
  // Settings Screen
  languagePreference: {
    english: 'Language Preference',
    spanish: 'Preferencia de Idioma'
  },
  defaultRightsCategory: {
    english: 'Default Rights Category',
    spanish: 'Categoría de Derechos Predeterminada'
  },
  
  // Rights Categories
  police: {
    english: 'Police',
    spanish: 'Policía'
  },
  ice: {
    english: 'ICE',
    spanish: 'ICE'
  },
  border: {
    english: 'Border Patrol',
    spanish: 'Patrulla Fronteriza'
  },
  
  // Common Actions
  ok: {
    english: 'OK',
    spanish: 'OK'
  },
  cancel: {
    english: 'Cancel',
    spanish: 'Cancelar'
  },
  delete: {
    english: 'Delete',
    spanish: 'Eliminar'
  },
  save: {
    english: 'Save',
    spanish: 'Guardar'
  },
  
  // Status
  complete: {
    english: 'Complete',
    spanish: 'Completo'
  },
  processing: {
    english: 'Processing',
    spanish: 'Procesando'
  },
  failed: {
    english: 'Failed',
    spanish: 'Fallido'
  },
  
  // Quality
  excellent: {
    english: 'Excellent',
    spanish: 'Excelente'
  },
  good: {
    english: 'Good',
    spanish: 'Buena'
  },
  fair: {
    english: 'Fair',
    spanish: 'Regular'
  },
  poor: {
    english: 'Poor',
    spanish: 'Pobre'
  }
};

class TranslationService {
  private static instance: TranslationService;

  private constructor() {}

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  public translate(key: string, language: 'english' | 'spanish'): string {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation key "${key}" not found`);
      return key;
    }
    return translation[language] || translation.english;
  }

  public getTranslations(): Translations {
    return translations;
  }
}

export default TranslationService;