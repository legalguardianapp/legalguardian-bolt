import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  Switch,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { typography, getResponsiveFontSize, textStyles } from '@/utils/typography';
import RealTimeLegalAI from '@/components/RealTimeLegalAI';
import SessionManager from '@/components/SessionManager';
import { LegalTip } from '@/components/LegalSpeechAnalyzer';
import SpeechRecognitionService from '@/components/SpeechRecognitionService';
import FadeInView from '@/components/FadeInView';
import AnimatedButton from '@/components/AnimatedButton';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;

export default function RecordingScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const sessionManager = SessionManager.getInstance();
  const speechRecognitionService = SpeechRecognitionService.getInstance();
  
  // Camera and permissions state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioRecording, setAudioRecording] = useState<Audio.Recording | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);
  
  // Location state
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  
  // Real-time AI state
  const [showAIText, setShowAIText] = useState(true);
  const [speakAITips, setSpeakAITips] = useState(true);
  const [aiTipsDetected, setAiTipsDetected] = useState(0);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Timer ref for recording duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize permissions and location on mount
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
    
    initializePermissions();
    
    // Start pulsing animation
    startPulseAnimation();
    
    return () => {
      // Cleanup timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop any ongoing recording
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  // Start pulsing animation for record button
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Initialize all required permissions
  const initializePermissions = async () => {
    try {
      setIsLoading(true);
      
      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus === 'granted');
      
      if (locationStatus === 'granted') {
        try {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);
        } catch (error) {
          console.log('Location error:', error);
        }
      }
      
    } catch (error) {
      console.error('Permission initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle camera flip
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Start recording function
  const startRecording = async () => {
    try {
      setIsLoading(true);
      
      // Check camera permission
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please grant camera permission to record legal protection sessions.',
            [{ text: 'OK' }]
          );
          setIsLoading(false);
          return;
        }
      }

      // Request audio permission and start recording
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Audio Permission Required',
          'Please grant microphone permission to record audio.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start audio recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setAudioRecording(recording);

      // Start session in SessionManager
      const session = sessionManager.startSession({
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Current Location'
        } : undefined
      });
      setCurrentSession(session);

      // Start recording state
      setIsRecording(true);
      setRecordingDuration(0);
      setAiTipsDetected(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        'Recording Error',
        'Failed to start recording. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Stop recording function
  const stopRecording = async () => {
    try {
      setIsLoading(true);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop audio recording
      let audioUri = null;
      if (audioRecording) {
        await audioRecording.stopAndUnloadAsync();
        audioUri = audioRecording.getURI();
        console.log('Recording saved to:', audioUri);
        setAudioRecording(null);
      }

      // End session in SessionManager
      const endedSession = await sessionManager.endSession();
      
      // Save the session with actual duration
      if (endedSession) {
        await sessionManager.saveSession(recordingDuration, audioUri);
      }

      setIsRecording(false);
      setCurrentSession(null);
      
      // Show success message with AI tips summary
      const tipsSummary = aiTipsDetected > 0 
        ? ` AI detected ${aiTipsDetected} legal guidance opportunities during your session.`
        : '';
      
      Alert.alert(
        'Recording Saved',
        `Your ${formatDuration(recordingDuration)} legal protection session has been saved successfully.${tipsSummary}`,
        [
          {
            text: 'View History',
            onPress: () => router.push('/(tabs)/history')
          },
          {
            text: 'Record Another',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(
        'Error',
        'Failed to save recording. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI tip detection
  const handleAITipDetected = (tip: LegalTip) => {
    setAiTipsDetected(prev => prev + 1);
    console.log('AI tip detected:', tip.category, tip.urgency);
  };

  // Format duration helper
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle back navigation
  const handleBack = () => {
    if (isRecording) {
      Alert.alert(
        'Stop Recording?',
        'Are you sure you want to stop the current recording session?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          { 
            text: 'Stop & Exit', 
            style: 'destructive',
            onPress: async () => {
              await stopRecording();
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  // Render permission request screen
  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MaterialIcons name="videocam-off" size={64} color="#FFFFFF" />
          <Text style={[
            styles.permissionTitle,
            textStyles.headerMedium,
            {
              fontSize: getResponsiveFontSize('headerMedium', width),
              color: '#FFFFFF',
              marginTop: 24,
              marginBottom: 16,
            }
          ]}>
            Camera Permission Required
          </Text>
          <Text style={[
            styles.permissionDescription,
            textStyles.bodyLarge,
            {
              fontSize: getResponsiveFontSize('bodyLarge', width),
              color: '#FFFFFF',
              marginBottom: 32,
            }
          ]}>
            Legal Guardian needs camera access to record your legal protection sessions.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.permissionButtonText,
              textStyles.button,
              {
                fontSize: getResponsiveFontSize('button', width),
                color: '#000000',
              }
            ]}>
              GRANT CAMERA PERMISSION
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
      >
        {/* Real-Time Legal AI Overlay */}
        <RealTimeLegalAI
          isRecording={isRecording}
          showText={showAIText}
          speakTips={speakAITips}
          onTipDetected={handleAITipDetected}
        />

        {/* Top Controls */}
        <Animated.View 
          style={[
            styles.topControls,
            {
              paddingTop: Platform.OS === 'ios' ? 20 : 40,
              paddingHorizontal: isSmallScreen ? 20 : isMediumScreen ? 24 : 28,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, -20]
              }) }],
            }
          ]}
        >
          <AnimatedButton
            style={styles.topButton}
            onPress={handleBack}
            activeOpacity={0.7}
            scaleAmount={0.9}
            duration={100}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </AnimatedButton>

          <View style={styles.topCenter}>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <Animated.View 
                  style={[
                    styles.recordingDot,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [1, 0.5]
                      })
                    }
                  ]} 
                />
                <Text style={[
                  styles.recordingText,
                  textStyles.caption,
                  {
                    fontSize: getResponsiveFontSize('caption', width),
                    color: '#FFFFFF',
                  }
                ]}>
                  REC {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
          </View>

          <AnimatedButton
            style={styles.topButton}
            onPress={toggleCameraFacing}
            activeOpacity={0.7}
            scaleAmount={0.9}
            duration={100}
          >
            <MaterialIcons name="flip-camera-ios" size={24} color="#FFFFFF" />
          </AnimatedButton>
        </Animated.View>

        {/* Center Status */}
        <View style={styles.centerStatus}>
          {!isRecording && (
            <FadeInView 
              duration={800} 
              delay={300}
              style={styles.statusContainer}
            >
              <MaterialIcons name="shield" size={48} color="#FFFFFF" />
              <Text style={[
                styles.statusTitle,
                textStyles.headerMedium,
                {
                  fontSize: getResponsiveFontSize('headerMedium', width),
                  color: '#FFFFFF',
                  marginTop: 16,
                  marginBottom: 8,
                }
              ]}>
                LEGAL PROTECTION
              </Text>
              <Text style={[
                styles.statusSubtitle,
                textStyles.bodyMedium,
                {
                  fontSize: getResponsiveFontSize('bodyMedium', width),
                  color: '#FFFFFF',
                }
              ]}>
                Ready to record with AI guidance
              </Text>
            </FadeInView>
          )}
          
          {isRecording && (
            <FadeInView 
              duration={800} 
              delay={300}
              style={styles.recordingStatusContainer}
            >
              <Animated.View 
                style={[
                  styles.recordingPulse,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.7, 0]
                    })
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.recordingPulse,
                  {
                    transform: [{ 
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.8, 1.2]
                      }) 
                    }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.5, 0]
                    })
                  }
                ]} 
              />
              <View style={styles.recordingInnerCircle}>
                <Text style={[
                  styles.recordingTimer,
                  {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  }
                ]}>
                  {formatDuration(recordingDuration)}
                </Text>
                <Text style={[
                  styles.recordingLabel,
                  {
                    fontSize: 14,
                    color: '#FFFFFF',
                    marginTop: 4,
                  }
                ]}>
                  RECORDING
                </Text>
              </View>
            </FadeInView>
          )}
        </View>

        {/* AI Controls Panel */}
        {!isRecording && (
          <FadeInView 
            duration={600} 
            delay={500}
            style={styles.aiControlsPanel}
          >
            <Text style={[
              styles.aiControlsTitle,
              textStyles.caption,
              {
                fontSize: getResponsiveFontSize('caption', width),
                color: '#FFFFFF',
                marginBottom: 12,
              }
            ]}>
              AI LEGAL GUIDANCE SETTINGS
            </Text>
            
            <View style={styles.aiControlRow}>
              <View style={styles.aiControlInfo}>
                <MaterialIcons name="visibility" size={20} color="#FFFFFF" />
                <Text style={[
                  styles.aiControlLabel,
                  textStyles.bodyMedium,
                  {
                    fontSize: getResponsiveFontSize('bodyMedium', width),
                    color: '#FFFFFF',
                    marginLeft: 8,
                  }
                ]}>
                  Show AI Tips
                </Text>
              </View>
              <Switch
                value={showAIText}
                onValueChange={setShowAIText}
                trackColor={{ false: '#767577', true: '#22C55E' }}
                thumbColor={showAIText ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.aiControlRow}>
              <View style={styles.aiControlInfo}>
                <MaterialIcons name="volume-up" size={20} color="#FFFFFF" />
                <Text style={[
                  styles.aiControlLabel,
                  textStyles.bodyMedium,
                  {
                    fontSize: getResponsiveFontSize('bodyMedium', width),
                    color: '#FFFFFF',
                    marginLeft: 8,
                  }
                ]}>
                  Speak Tips Aloud
                </Text>
              </View>
              <Switch
                value={speakAITips}
                onValueChange={setSpeakAITips}
                trackColor={{ false: '#767577', true: '#22C55E' }}
                thumbColor={speakAITips ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
          </FadeInView>
        )}

        {/* Bottom Controls */}
        <Animated.View 
          style={[
            styles.bottomControls,
            {
              paddingBottom: Platform.OS === 'ios' ? 40 : 30,
              paddingHorizontal: isSmallScreen ? 20 : isMediumScreen ? 24 : 28,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim.interpolate({
                inputRange: [0, 50],
                outputRange: [0, 20]
              }) }],
            }
          ]}
        >
          {/* Location Status */}
          <View style={styles.locationStatus}>
            <MaterialIcons 
              name={locationPermission ? "location-on" : "location-off"} 
              size={16} 
              color={locationPermission ? "#22C55E" : "#FFFFFF"} 
            />
            <Text style={[
              styles.locationText,
              textStyles.caption,
              {
                fontSize: getResponsiveFontSize('caption', width),
                color: locationPermission ? '#22C55E' : '#FFFFFF',
                marginLeft: 6,
              }
            ]}>
              {locationPermission ? 'Location Active' : 'Location Disabled'}
            </Text>
          </View>

          {/* AI Status */}
          {isRecording && (
            <View style={styles.aiStatus}>
              <MaterialIcons name="psychology" size={16} color="#22C55E" />
              <Text style={[
                styles.aiStatusText,
                textStyles.caption,
                {
                  fontSize: getResponsiveFontSize('caption', width),
                  color: '#22C55E',
                  marginLeft: 6,
                }
              ]}>
                AI: {aiTipsDetected} tips detected
              </Text>
            </View>
          )}

          {/* Main Record Button */}
          <View style={styles.recordButtonContainer}>
            <AnimatedButton
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
                {
                  width: isSmallScreen ? 80 : isMediumScreen ? 85 : 90,
                  height: isSmallScreen ? 80 : isMediumScreen ? 85 : 90,
                  transform: [{ scale: isRecording ? 1 : pulseAnim }]
                }
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              activeOpacity={0.8}
              scaleAmount={0.95}
              duration={150}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : (
                <MaterialIcons 
                  name={isRecording ? "stop" : "fiber-manual-record"} 
                  size={isSmallScreen ? 36 : isMediumScreen ? 40 : 44} 
                  color={isRecording ? "#FFFFFF" : "#FF3B30"} 
                />
              )}
            </AnimatedButton>
          </View>

          {/* Recording Info */}
          <View style={styles.recordingInfo}>
            {isRecording ? (
              <Text style={[
                styles.recordingInfoText,
                textStyles.caption,
                {
                  fontSize: getResponsiveFontSize('caption', width),
                  color: '#FFFFFF',
                }
              ]}>
                Tap to stop • AI monitoring
              </Text>
            ) : (
              <Text style={[
                styles.recordingInfoText,
                textStyles.caption,
                {
                  fontSize: getResponsiveFontSize('caption', width),
                  color: '#FFFFFF',
                }
              ]}>
                Tap to record with AI guidance
              </Text>
            )}
          </View>
        </Animated.View>
      </CameraView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={[
            styles.loadingText,
            textStyles.bodyMedium,
            {
              fontSize: getResponsiveFontSize('bodyMedium', width),
              color: '#FFFFFF',
              marginTop: 16,
            }
          ]}>
            {isRecording ? 'Stopping recording...' : 'Starting recording...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Camera
  camera: {
    flex: 1,
  },

  // Permission Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#000000',
  },
  permissionTitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wide,
  },
  permissionDescription: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionText: {
    fontFamily: typography.fontFamily.primary,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  permissionButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  permissionButtonText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Top Controls
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },

  // Recording Indicator
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordingText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Center Status
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusTitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.wider,
  },
  statusSubtitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
  },
  
  // Recording Status Container (new)
  recordingStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
    position: 'relative',
  },
  recordingPulse: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  recordingInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderWidth: 2,
    borderColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  recordingTimer: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  recordingLabel: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // AI Controls Panel
  aiControlsPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  aiControlsTitle: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
  },
  aiControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiControlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiControlLabel: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
  },

  // Bottom Controls
  bottomControls: {
    alignItems: 'center',
    paddingTop: 20,
  },

  // Location Status
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.normal,
  },

  // AI Status
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiStatusText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: typography.letterSpacing.normal,
  },

  // Record Button
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButton: {
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Recording Info
  recordingInfo: {
    alignItems: 'center',
  },
  recordingInfoText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.normal,
  },

  // Loading Overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});