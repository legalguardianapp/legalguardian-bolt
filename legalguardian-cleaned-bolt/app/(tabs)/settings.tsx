import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import FadeInView from '@/components/FadeInView';

const { width } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;

type RightsCategory = 'police' | 'ice' | 'border';
type LanguagePreference = 'english' | 'spanish';

export default function SettingsScreen() {
  const router = useRouter();
  const [rightsCategory, setRightsCategory] = useState<RightsCategory>('police');
  const [language, setLanguage] = useState<LanguagePreference>('english');
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  // Load preferences on mount
  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    
    const loadPreferences = async () => {
      try {
        // Load user preferences here when available
        // const preferences = await userPreferencesManager.getPreferences();
        // if (preferences.enforcementType) setRightsCategory(preferences.enforcementType);
        // if (preferences.language) setLanguage(preferences.language);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Handlers for settings options
  const handleLanguagePress = () => {
    console.log('Language settings pressed');
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => setLanguage('english') },
        { text: 'Español', onPress: () => setLanguage('spanish') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleRightsCategoryPress = () => {
    console.log('Rights category settings pressed');
    Alert.alert(
      'Select Default Rights Category',
      'Choose the type of rights information you want to see by default',
      [
        { text: 'Police', onPress: () => setRightsCategory('police') },
        { text: 'ICE', onPress: () => setRightsCategory('ice') },
        { text: 'Border Patrol', onPress: () => setRightsCategory('border') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTermsPress = () => {
    console.log('Terms of use pressed');
    router.push('/terms');
  };

  const handlePrivacyPress = () => {
    console.log('Privacy policy pressed');
    router.push('/privacy-policy');
  };

  const handleSupportPress = () => {
    console.log('Contact support pressed');
    // TODO: Implement support contact functionality
  };

  const handleFAQsPress = () => {
    console.log('Legal FAQs pressed');
    // TODO: Implement FAQs screen
  };

  const handleAboutPress = () => {
    console.log('About Legal Guardian pressed');
    // TODO: Implement about screen
  };

  // Helper to get translated text
  const getText = (english: string, spanish: string) => {
    return language === 'english' ? english : spanish;
  };

  // Helper to get current language display text
  const getLanguageDisplayText = () => {
    return language === 'english' ? 'English' : 'Español';
  };

  // Helper to get current rights category display text
  const getRightsCategoryDisplayText = () => {
    const categories = {
      police: getText('Police', 'Policía'),
      ice: getText('ICE', 'ICE'),
      border: getText('Border Patrol', 'Patrulla Fronteriza'),
    };
    return categories[rightsCategory];
  };

  // Setting row component with improved spacing
  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    showDivider = true,
    index = 0,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showDivider?: boolean;
    index?: number;
  }) => (
    <FadeInView 
      duration={500} 
      delay={200 + (index * 100)}
      style={styles.settingRowContainer}
    >
      <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.settingRowLeft}>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name={icon as any} 
              size={24} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.settingTitle}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.settingSubtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <MaterialIcons 
            name="chevron-right" 
            size={24} 
            color="#FFFFFF" 
          />
        </View>
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </FadeInView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}
      >
        <Text style={styles.headerTitle}>
          {getText('SETTINGS', 'AJUSTES')}
        </Text>
      </Animated.View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Settings List */}
        <View style={styles.settingsContainer}>
          
          {/* Language Preference */}
          <SettingRow
            icon="language"
            title={getText('Language Preference', 'Preferencia de Idioma')}
            subtitle={getLanguageDisplayText()}
            onPress={handleLanguagePress}
            index={0}
          />

          {/* Default Rights Category */}
          <SettingRow
            icon="shield"
            title={getText('Default Rights Category', 'Categoría de Derechos Predeterminada')}
            subtitle={getRightsCategoryDisplayText()}
            onPress={handleRightsCategoryPress}
            index={1}
          />

          {/* Terms of Use */}
          <SettingRow
            icon="description"
            title={getText('Terms of Use', 'Términos de Uso')}
            onPress={handleTermsPress}
            index={2}
          />

          {/* Privacy Policy */}
          <SettingRow
            icon="privacy-tip"
            title={getText('Privacy Policy', 'Política de Privacidad')}
            onPress={handlePrivacyPress}
            index={3}
          />

          {/* Contact Support */}
          <SettingRow
            icon="support"
            title={getText('Contact Support', 'Contactar Soporte')}
            onPress={handleSupportPress}
            index={4}
          />

          {/* Legal FAQs */}
          <SettingRow
            icon="help"
            title={getText('Legal FAQs', 'Preguntas Frecuentes Legales')}
            onPress={handleFAQsPress}
            index={5}
          />

          {/* About Legal Guardian */}
          <SettingRow
            icon="info"
            title={getText('About Legal Guardian', 'Acerca de Legal Guardian')}
            onPress={handleAboutPress}
            showDivider={false}
            index={6}
          />
        </View>

        {/* App Version */}
        <FadeInView 
          duration={500} 
          delay={900}
          style={styles.versionContainer}
        >
          <Text style={styles.versionText}>
            {getText('App Version 1.0.0', 'Versión 1.0.0')}
          </Text>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Header
  header: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Content
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },

  // Settings Container
  settingsContainer: {
    backgroundColor: '#000000',
    paddingTop: 24,
  },

  // Setting Row Container
  settingRowContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  // Setting Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    minHeight: 76,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    maxWidth: '85%',
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    marginRight: 16,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
    flexWrap: 'wrap',
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.7,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
    flexWrap: 'wrap',
  },
  chevronContainer: {
    flexShrink: 0,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
    marginTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
});