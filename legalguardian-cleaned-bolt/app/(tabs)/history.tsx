import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import SessionManager, { SessionData } from '@/components/SessionManager';
import UserPreferencesManager from '@/utils/userPreferences';
import TranslationService from '@/utils/translations';
import FadeInView from '@/components/FadeInView';
import AnimatedButton from '@/components/AnimatedButton';

const { width } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;

export default function SessionHistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [playingSession, setPlayingSession] = useState<string | null>(null);
  const [speakingSession, setSpeakingSession] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [userLanguage, setUserLanguage] = useState<'english' | 'spanish'>('english');
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  const sessionManager = SessionManager.getInstance();
  const userPreferencesManager = UserPreferencesManager.getInstance();
  const translationService = TranslationService.getInstance();

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
    
    loadSessions();

    // Load user language preference
    const preferences = userPreferencesManager.getPreferences();
    setUserLanguage(preferences.language);

    // Listen for session updates
    const handleSessionUpdate = (updatedSessions: SessionData[]) => {
      setSessions(updatedSessions);
    };

    // Listen for preference changes
    const handlePreferenceChange = (newPreferences: any) => {
      setUserLanguage(newPreferences.language);
    };

    sessionManager.addListener(handleSessionUpdate);
    userPreferencesManager.addListener(handlePreferenceChange);

    return () => {
      sessionManager.removeListener(handleSessionUpdate);
      userPreferencesManager.removeListener(handlePreferenceChange);
    };
  }, []);

  const loadSessions = async () => {
    try {
      const loadedSessions = await sessionManager.getSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadSessions();
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayAudio = (sessionId: string) => {
    if (playingSession === sessionId) {
      setPlayingSession(null);
    } else {
      setPlayingSession(sessionId);
      setTimeout(() => {
        setPlayingSession(null);
      }, 3000);
    }
  };

  const handleSpeakSummary = async (session: SessionData) => {
    try {
      if (speakingSession === session.id) {
        Speech.stop();
        setSpeakingSession(null);
        return;
      }

      // Use AI analysis summary if available, otherwise use snippet
      const summaryToSpeak = session.aiAnalysis?.summary || session.snippet;
      
      if (!summaryToSpeak || summaryToSpeak === 'Processing session analysis...') {
        const alertTitle = userLanguage === 'spanish' ? 'No Hay Resumen Disponible' : 'No Summary Available';
        const alertMessage = userLanguage === 'spanish' 
          ? 'No hay un resumen de análisis disponible para leer en voz alta para esta sesión.'
          : 'There is no analysis summary available to read aloud for this session.';
        
        Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
        return;
      }

      setSpeakingSession(session.id);

      const speechOptions = {
        language: userLanguage === 'spanish' ? 'es-ES' : 'en-US',
        pitch: 1.0,
        rate: 0.8,
        quality: 'enhanced' as const,
        onDone: () => setSpeakingSession(null),
        onStopped: () => setSpeakingSession(null),
        onError: () => {
          setSpeakingSession(null);
          const alertTitle = userLanguage === 'spanish' ? 'Error de Voz' : 'Speech Error';
          const alertMessage = userLanguage === 'spanish'
            ? 'No se puede leer el resumen en voz alta. Por favor, inténtelo de nuevo.'
            : 'Unable to read the summary aloud. Please try again.';
          
          Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
        },
      };

      const speechPrefix = userLanguage === 'spanish' ? 'Resumen de sesión legal: ' : 'Legal session summary: ';
      const speechText = `${speechPrefix}${summaryToSpeak}`;
      Speech.speak(speechText, speechOptions);
    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingSession(null);
      const alertTitle = userLanguage === 'spanish' ? 'Error de Voz' : 'Speech Error';
      const alertMessage = userLanguage === 'spanish'
        ? 'No se puede leer el resumen en voz alta. Por favor, inténtelo de nuevo.'
        : 'Unable to read the summary aloud. Please try again.';
      
      Alert.alert(alertTitle, alertMessage, [{ text: 'OK' }]);
    }
  };

  const handleExpandSession = (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    const alertTitle = userLanguage === 'spanish' ? 'Eliminar Sesión' : 'Delete Session';
    const alertMessage = userLanguage === 'spanish'
      ? '¿Está seguro de que desea eliminar esta sesión? Esta acción no se puede deshacer.'
      : 'Are you sure you want to delete this session? This action cannot be undone.';
    const cancelText = userLanguage === 'spanish' ? 'Cancelar' : 'Cancel';
    const deleteText = userLanguage === 'spanish' ? 'Eliminar' : 'Delete';
    
    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: cancelText, style: 'cancel' },
        { 
          text: deleteText, 
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionManager.deleteSession(sessionId);
              if (expandedSession === sessionId) {
                setExpandedSession(null);
              }
              if (speakingSession === sessionId) {
                Speech.stop();
                setSpeakingSession(null);
              }
              await loadSessions();
            } catch (error) {
              console.error('Failed to delete session:', error);
              const errorTitle = userLanguage === 'spanish' ? 'Error' : 'Error';
              const errorMessage = userLanguage === 'spanish'
                ? 'No se pudo eliminar la sesión. Por favor, inténtelo de nuevo.'
                : 'Failed to delete session. Please try again.';
              Alert.alert(errorTitle, errorMessage);
            }
          }
        }
      ]
    );
  };

  const handleLawyerReferral = (urgencyLevel?: 'normal' | 'urgent' | 'critical') => {
    const isUrgent = urgencyLevel === 'critical' || urgencyLevel === 'urgent';
    
    const title = userLanguage === 'spanish' ? 'Referencia de Abogado' : 'Lawyer Referral';
    const message = userLanguage === 'spanish'
      ? isUrgent 
        ? '🚨 URGENTE: Contacte a un abogado inmediatamente. Seleccione una opción:'
        : 'Seleccione una opción para obtener asistencia legal:'
      : isUrgent
        ? '🚨 URGENT: Contact a lawyer immediately. Select an option:'
        : 'Select an option to get legal assistance:';

    const hotlineText = userLanguage === 'spanish' ? '📞 Línea Directa Legal' : '📞 Legal Hotline';
    const websiteText = userLanguage === 'spanish' ? '🌐 Sitios Web de Referencia' : '🌐 Referral Websites';
    const cancelText = userLanguage === 'spanish' ? 'Cancelar' : 'Cancel';

    Alert.alert(
      title,
      message,
      [
        {
          text: hotlineText,
          onPress: () => {
            const hotlineTitle = userLanguage === 'spanish' ? 'Líneas Directas Legales' : 'Legal Hotlines';
            const hotlineMessage = userLanguage === 'spanish'
              ? 'Línea Nacional de Inmigración: 1-844-363-1423 (24/7)\nACLU Derechos de Inmigrantes: 1-877-336-2700'
              : 'National Immigration Hotline: 1-844-363-1423 (24/7)\nACLU Immigrants Rights: 1-877-336-2700';
            Alert.alert(hotlineTitle, hotlineMessage);
          }
        },
        {
          text: websiteText,
          onPress: () => {
            const websiteTitle = userLanguage === 'spanish' ? 'Sitios Web de Referencia' : 'Referral Websites';
            const websiteMessage = userLanguage === 'spanish'
              ? 'Asociación Americana de Abogados de Inmigración: aila.org\nForo Nacional de Inmigración: immigrationforum.org'
              : 'American Immigration Lawyers Association: aila.org\nNational Immigration Forum: immigrationforum.org';
            Alert.alert(websiteTitle, websiteMessage);
          }
        },
        { text: cancelText, style: 'cancel' }
      ]
    );
  };

  // Handle Contact a Lawyer button press
  const handleContactLawyer = async (session: SessionData) => {
    const urgencyLevel = session.aiAnalysis?.urgencyLevel || 'normal';
    
    // Check if there are specific recommended actions with referral type
    const hasReferralAction = session.aiAnalysis?.recommendedActions?.some(action => 
      action.toLowerCase().includes('lawyer') || action.toLowerCase().includes('attorney')
    );

    if (hasReferralAction || session.aiAnalysis?.requiresLegalAttention) {
      // Show lawyer referral options
      handleLawyerReferral(urgencyLevel);
    } else {
      // Fallback to general legal resources
      const title = userLanguage === 'spanish' ? 'Recursos Legales' : 'Legal Resources';
      const message = userLanguage === 'spanish'
        ? 'Aquí hay algunos recursos para encontrar asistencia legal:'
        : 'Here are some resources to find legal assistance:';
      
      Alert.alert(title, message, [
        {
          text: userLanguage === 'spanish' ? 'Buscar Abogados' : 'Find Lawyers',
          onPress: () => {
            // Open a legal referral website
            const url = 'https://www.avvo.com/find-a-lawyer';
            Linking.openURL(url).catch(() => {
              Alert.alert(
                userLanguage === 'spanish' ? 'Error' : 'Error',
                userLanguage === 'spanish' 
                  ? 'No se pudo abrir el enlace. Por favor, visite avvo.com manualmente.'
                  : 'Could not open link. Please visit avvo.com manually.'
              );
            });
          }
        },
        {
          text: userLanguage === 'spanish' ? 'Cancelar' : 'Cancel',
          style: 'cancel'
        }
      ]);
    }
  };

  const generateSessionTitle = (session: SessionData) => {
    if (session.aiAnalysis?.situationType) {
      return session.aiAnalysis.situationType;
    }
    
    const titles = userLanguage === 'spanish' 
      ? [
          'Parada de Tráfico Policial',
          'Reunión Laboral',
          'Problema de Derechos del Consumidor',
          'Discusión de Propiedad',
          'Consulta Legal',
          'Reclamo de Seguro',
          'Problema de Derechos de Inquilino',
          'Asunto de Empleo'
        ]
      : [
          'Police Traffic Stop',
          'Workplace Meeting',
          'Consumer Rights Issue',
          'Property Discussion',
          'Legal Consultation',
          'Insurance Claim',
          'Tenant Rights Issue',
          'Employment Matter'
        ];
    
    const index = parseInt(session.id.slice(-1)) || 0;
    return titles[index % titles.length];
  };

  const renderEmptyState = () => (
    <FadeInView 
      duration={800} 
      delay={300}
      style={styles.emptyState}
    >
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="shield" size={64} color="#FFFFFF" />
      </View>
      
      <Text style={styles.emptyTitle}>
        {userLanguage === 'spanish' ? 'AÚN NO HAY SESIONES' : 'NO SESSIONS YET'}
      </Text>
      <Text style={styles.emptyMessage}>
        {userLanguage === 'spanish'
          ? 'Comience su primera sesión de protección legal para empezar a construir su historial seguro. Todas sus grabaciones y análisis de IA aparecerán aquí.'
          : 'Start your first legal protection session to begin building your secure history. All your recordings and AI analysis will appear here.'
        }
      </Text>
      
      <AnimatedButton
        style={styles.startSessionButton}
        onPress={() => router.push('/(tabs)/recording')}
        activeOpacity={0.8}
        scaleAmount={0.95}
        duration={150}
      >
        <MaterialIcons name="play-arrow" size={20} color="#000000" />
        <Text style={styles.startSessionButtonText}>
          {userLanguage === 'spanish' ? 'COMENZAR PRIMERA SESIÓN' : 'START YOUR FIRST SESSION'}
        </Text>
      </AnimatedButton>
    </FadeInView>
  );

  const renderAIAnalysisPreview = (session: SessionData) => {
    if (!session.aiAnalysis || session.status !== 'Complete') return null;

    const { aiAnalysis } = session;
    const isExpanded = expandedSession === session.id;

    return (
      <View style={styles.aiAnalysisContainer}>
        <View style={styles.aiAnalysisHeader}>
          <View style={styles.aiAnalysisHeaderLeft}>
            <MaterialIcons name="psychology" size={16} color="#22C55E" />
            <Text style={styles.aiAnalysisTitle}>
              {userLanguage === 'spanish' ? 'ANÁLISIS IA' : 'AI ANALYSIS'}
            </Text>
          </View>
          <View style={[
            styles.riskLevelBadge,
            { 
              backgroundColor: aiAnalysis.riskLevel === 'low' ? '#22C55E' : 
                              aiAnalysis.riskLevel === 'medium' ? '#FFA500' : '#FF3B30'
            }
          ]}>
            <Text style={styles.riskLevelText}>
              {userLanguage === 'spanish' 
                ? aiAnalysis.riskLevel === 'low' ? 'BAJO' : aiAnalysis.riskLevel === 'medium' ? 'MEDIO' : 'ALTO'
                : aiAnalysis.riskLevel.toUpperCase()
              }
            </Text>
          </View>
        </View>

        <Text style={styles.summaryText} numberOfLines={isExpanded ? undefined : 3}>
          {aiAnalysis.summary}
        </Text>

        {/* Recommended Actions Section */}
        {aiAnalysis.recommendedActions && aiAnalysis.recommendedActions.length > 0 && (
          <View style={styles.recommendedActionsSection}>
            <View style={styles.recommendedActionsHeader}>
              <MaterialIcons name="checklist" size={14} color="#22C55E" />
              <Text style={styles.recommendedActionsTitle}>
                {userLanguage === 'spanish' ? 'ACCIONES RECOMENDADAS' : 'RECOMMENDED ACTIONS'}
              </Text>
            </View>
            <View style={styles.recommendedActionsList}>
              {aiAnalysis.recommendedActions.slice(0, isExpanded ? undefined : 2).map((action, index) => (
                <View key={index} style={styles.recommendedActionItem}>
                  <View style={styles.actionBullet} />
                  <Text style={styles.actionText}>
                    {action}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lawyer Recommendation Section */}
        {aiAnalysis.requiresLegalAttention && aiAnalysis.lawyerRecommendation && (
          <View style={[
            styles.lawyerRecommendationSection,
            { 
              backgroundColor: aiAnalysis.urgencyLevel === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              borderColor: aiAnalysis.urgencyLevel === 'critical' ? '#EF4444' : '#3B82F6'
            }
          ]}>
            <View style={styles.lawyerRecommendationHeader}>
              <MaterialIcons name="gavel" size={16} color={aiAnalysis.urgencyLevel === 'critical' ? '#EF4444' : '#3B82F6'} />
              <Text style={[
                styles.lawyerRecommendationTitle,
                { color: aiAnalysis.urgencyLevel === 'critical' ? '#EF4444' : '#3B82F6' }
              ]}>
                {userLanguage === 'spanish' ? 'RECOMENDACIÓN LEGAL' : 'LEGAL RECOMMENDATION'}
              </Text>
            </View>
            <Text style={styles.lawyerRecommendationText}>
              {aiAnalysis.lawyerRecommendation}
            </Text>
            <AnimatedButton
              style={[
                styles.contactLawyerButton,
                { backgroundColor: aiAnalysis.urgencyLevel === 'critical' ? '#EF4444' : '#22C55E' }
              ]}
              onPress={() => handleContactLawyer(session)}
              activeOpacity={0.8}
              scaleAmount={0.95}
              duration={150}
            >
              <MaterialIcons name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.contactLawyerButtonText}>
                {userLanguage === 'spanish' ? 'CONTACTAR ABOGADO' : 'CONTACT A LAWYER'}
              </Text>
            </AnimatedButton>
          </View>
        )}

        {aiAnalysis.areasForImprovement && aiAnalysis.areasForImprovement.length > 0 && (
          <View style={styles.tipsPreviewSection}>
            <View style={styles.tipsHeader}>
              <MaterialIcons name="lightbulb" size={14} color="#FFFFFF" />
              <Text style={styles.tipsTitle}>
                {userLanguage === 'spanish' ? 'PUNTOS CLAVE' : 'KEY INSIGHTS'}
              </Text>
            </View>
            <View style={styles.tipsList}>
              {aiAnalysis.areasForImprovement.slice(0, isExpanded ? undefined : 2).map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {isExpanded && aiAnalysis.whatWentWell && aiAnalysis.whatWentWell.length > 0 && (
          <View style={styles.strengthsSection}>
            <View style={styles.strengthsHeader}>
              <MaterialIcons name="check-circle" size={14} color="#22C55E" />
              <Text style={styles.strengthsTitle}>
                {userLanguage === 'spanish' ? 'LO QUE HIZO BIEN' : 'WHAT YOU DID WELL'}
              </Text>
            </View>
            <View style={styles.strengthsList}>
              {aiAnalysis.whatWentWell.slice(0, 3).map((strength, index) => (
                <View key={index} style={styles.strengthItem}>
                  <View style={styles.strengthBullet} />
                  <Text style={styles.strengthText}>
                    {strength}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSessionItem = (session: SessionData, index: number) => {
    const isPlaying = playingSession === session.id;
    const isSpeaking = speakingSession === session.id;
    const isExpanded = expandedSession === session.id;
    const sessionTitle = generateSessionTitle(session);
    
    return (
      <FadeInView 
        key={session.id} 
        duration={500} 
        delay={200 + (index * 100)}
        style={[
          styles.sessionCard, 
          isExpanded && styles.sessionCardExpanded
        ]}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.sessionMainInfo}>
            <View style={styles.sessionTitleContainer}>
              <Text style={styles.sessionTitle}>
                {sessionTitle}
              </Text>
              <View style={styles.sessionMeta}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="calendar-today" size={12} color="#FFFFFF" />
                  <Text style={styles.sessionDate}>
                    {session.date}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="access-time" size={12} color="#FFFFFF" />
                  <Text style={styles.sessionTime}>
                    {session.time} • {session.duration}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.sessionActions}>
              <AnimatedButton
                style={[
                  styles.actionButton, 
                  isPlaying && styles.actionButtonActive
                ]}
                onPress={() => handlePlayAudio(session.id)}
                activeOpacity={0.7}
                scaleAmount={0.9}
                duration={100}
              >
                {isPlaying ? (
                  <MaterialIcons name="pause" size={16} color="#000000" />
                ) : (
                  <MaterialIcons name="play-arrow" size={16} color="#FFFFFF" />
                )}
              </AnimatedButton>

              <AnimatedButton
                style={[
                  styles.actionButton, 
                  isSpeaking && styles.actionButtonActive
                ]}
                onPress={() => handleSpeakSummary(session)}
                activeOpacity={0.7}
                scaleAmount={0.9}
                duration={100}
              >
                {isSpeaking ? (
                  <MaterialIcons name="volume-off" size={16} color="#000000" />
                ) : (
                  <MaterialIcons name="volume-up" size={16} color="#FFFFFF" />
                )}
              </AnimatedButton>
              
              <AnimatedButton
                style={styles.actionButton}
                onPress={() => handleDeleteSession(session.id, sessionTitle)}
                activeOpacity={0.7}
                scaleAmount={0.9}
                duration={100}
              >
                <MaterialIcons name="delete" size={16} color="#FFFFFF" />
              </AnimatedButton>
            </View>
          </View>
        </View>

        <View style={styles.sessionStatusContainer}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: session.status === 'Complete' ? '#22C55E' : '#FFFFFF' }]} />
              <Text style={styles.statusText}>
                {userLanguage === 'spanish' 
                  ? session.status === 'Complete' ? 'Completo' : session.status === 'Processing' ? 'Procesando' : 'Fallido'
                  : session.status
                }
              </Text>
            </View>
            
            <View style={styles.statusItem}>
              <View style={[styles.qualityDot, { backgroundColor: session.quality === 'Excellent' ? '#22C55E' : '#FFFFFF' }]} />
              <Text style={styles.statusText}>
                {userLanguage === 'spanish' 
                  ? `${session.quality === 'Excellent' ? 'Excelente' : session.quality === 'Good' ? 'Buena' : 'Regular'} Calidad`
                  : `${session.quality} Quality`
                }
              </Text>
            </View>
          </View>
        </View>

        {renderAIAnalysisPreview(session)}

        {/* Session Snippet Display */}
        <View style={styles.sessionSnippetContainer}>
          <Text style={styles.sessionSnippet} numberOfLines={isExpanded ? undefined : 2}>
            {session.snippet}
          </Text>
        </View>

        {session.status === 'Processing' && (
          <View style={styles.processingIndicator}>
            <MaterialIcons name="auto-awesome" size={16} color="#22C55E" />
            <Text style={styles.processingText}>
              {userLanguage === 'spanish' ? 'IA ESTÁ ANALIZANDO SU SESIÓN...' : 'AI IS ANALYZING YOUR SESSION...'}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {session.status === 'Complete' && session.aiAnalysis && (
            <AnimatedButton
              style={styles.expandButton}
              onPress={() => handleExpandSession(session.id)}
              activeOpacity={0.7}
              scaleAmount={0.95}
              duration={150}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded 
                  ? (userLanguage === 'spanish' ? 'MOSTRAR MENOS' : 'SHOW LESS')
                  : (userLanguage === 'spanish' ? 'MOSTRAR MÁS DETALLES' : 'SHOW MORE DETAILS')
                }
              </Text>
              {isExpanded ? (
                <MaterialIcons name="keyboard-arrow-up" size={16} color="#FFFFFF" />
              ) : (
                <MaterialIcons name="keyboard-arrow-down" size={16} color="#FFFFFF" />
              )}
            </AnimatedButton>
          )}
        </View>
      </FadeInView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, -20]
            }) }],
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {userLanguage === 'spanish' ? 'HISTORIAL DE SESIONES' : 'SESSION HISTORY'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {userLanguage === 'spanish' 
              ? 'Su cronología de protección legal y análisis'
              : 'Your legal protection timeline & analysis'
            }
          </Text>
        </View>
      </Animated.View>

      {sessions.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#22C55E"
            />
          }
        >
          <FadeInView 
            duration={600} 
            delay={200}
            style={styles.sessionsContainer}
          >
            <Text style={styles.sectionTitle}>
              {userLanguage === 'spanish' 
                ? `SESIONES RECIENTES (${sessions.length})`
                : `RECENT SESSIONS (${sessions.length})`
              }
            </Text>
            
            {sessions.map(renderSessionItem)}
          </FadeInView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // Fixed Header
  header: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },

  // Sessions
  sessionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Session Cards
  sessionCard: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionCardExpanded: {
    borderColor: '#22C55E',
    borderWidth: 2,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Session Header
  sessionHeader: {
    marginBottom: 16,
  },
  sessionMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  sessionDate: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  sessionTime: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 8,
    marginLeft: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Session Snippet
  sessionSnippetContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
  },
  sessionSnippet: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Session Status
  sessionStatusContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  qualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // AI Analysis Container
  aiAnalysisContainer: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiAnalysisHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiAnalysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22C55E',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  riskLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Summary Section
  summaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Recommended Actions Section
  recommendedActionsSection: {
    marginBottom: 16,
  },
  recommendedActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedActionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22C55E',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  recommendedActionsList: {
    // No gap property, using marginBottom on items
  },
  recommendedActionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  actionBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginTop: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginLeft: 8,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Lawyer Recommendation Section
  lawyerRecommendationSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lawyerRecommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  lawyerRecommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  lawyerRecommendationText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  
  // Enhanced Contact Lawyer Button Styling
  contactLawyerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contactLawyerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Tips Preview Section
  tipsPreviewSection: {
    marginBottom: 12,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  tipsList: {
    // No gap property, using marginBottom on items
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginLeft: 8,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Strengths Section
  strengthsSection: {
    marginBottom: 12,
  },
  strengthsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22C55E',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  strengthsList: {
    // No gap property, using marginBottom on items
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  strengthBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginTop: 8,
  },
  strengthText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginLeft: 8,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Processing Indicator
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  processingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22C55E',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
  },
  expandButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 60,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  emptyMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: width * 0.8,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  startSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startSessionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
});