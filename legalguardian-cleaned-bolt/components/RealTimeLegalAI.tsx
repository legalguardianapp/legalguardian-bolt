import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { typography, getResponsiveFontSize, textStyles, textColors } from '@/utils/typography';
import SpeechRecognitionService from './SpeechRecognitionService';
import LegalSpeechAnalyzer, { LegalTip } from './LegalSpeechAnalyzer';

const { width } = Dimensions.get('window');

interface RealTimeLegalAIProps {
  isRecording: boolean;
  showText: boolean;
  speakTips: boolean;
  onTipDetected?: (tip: LegalTip) => void;
}

export default function RealTimeLegalAI({
  isRecording,
  showText,
  speakTips,
  onTipDetected
}: RealTimeLegalAIProps) {
  const [currentTip, setCurrentTip] = useState<LegalTip | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [detectedPhrases, setDetectedPhrases] = useState<string[]>([]);
  const [tipHistory, setTipHistory] = useState<LegalTip[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const tipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Services
  const speechRecognitionService = SpeechRecognitionService.getInstance();
  const legalSpeechAnalyzer = LegalSpeechAnalyzer.getInstance();

  // Start/stop listening based on recording state
  useEffect(() => {
    if (isRecording) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isRecording]);

  // Animate tip display
  useEffect(() => {
    if (currentTip && showText) {
      showTipAnimation();
    } else {
      hideTipAnimation();
    }
  }, [currentTip, showText]);

  const startListening = async () => {
    if (isListening) return;
    
    setIsListening(true);
    setTipHistory([]);
    console.log('🎤 Real-time legal AI listening started');

    // Start speech recognition
    const started = await speechRecognitionService.startListening({
      onSpeechResult: (text) => {
        console.log('Speech detected:', text);
        processDetectedSpeech(text);
      },
      onSpeechError: (error) => {
        console.error('Speech recognition error:', error);
      },
      onSpeechStart: () => {
        console.log('Speech recognition started');
      },
      onSpeechEnd: () => {
        console.log('Speech recognition ended');
      },
      continuous: true,
      language: 'en-US',
    });

    if (!started) {
      console.error('Failed to start speech recognition');
      // Fall back to simulation
      simulatePhaseDetection();
    }
  };

  const stopListening = () => {
    if (!isListening) return;
    
    setIsListening(false);
    setCurrentTip(null);
    
    // Stop speech recognition
    speechRecognitionService.stopListening();
    
    if (tipTimeoutRef.current) {
      clearTimeout(tipTimeoutRef.current);
      tipTimeoutRef.current = null;
    }
    
    console.log('🎤 Real-time legal AI listening stopped');
  };

  const simulatePhaseDetection = () => {
    // Simulate detecting phrases every 20-45 seconds during recording
    const getRandomInterval = () => Math.random() * 25000 + 20000; // 20-45 seconds
    
    const scheduleNextDetection = () => {
      if (!isListening) return;
      
      const delay = getRandomInterval();
      setTimeout(() => {
        if (isListening && isRecording) {
          // Prioritize high-urgency tips and avoid repeating recent tips
          const availableTips = legalSpeechAnalyzer.getAllTips().filter(tip => 
            !tipHistory.slice(-3).some(recent => recent.id === tip.id)
          );
          
          // Weighted selection favoring higher urgency
          const weightedTips = availableTips.flatMap(tip => {
            const weight = tip.urgency === 'high' ? 3 : tip.urgency === 'medium' ? 2 : 1;
            return Array(weight).fill(tip);
          });
          
          const randomTip = weightedTips[Math.floor(Math.random() * weightedTips.length)];
          const triggerPhrase = randomTip.trigger.split('|')[0];
          
          detectPhrase(triggerPhrase, randomTip);
        }
        scheduleNextDetection();
      }, delay);
    };

    scheduleNextDetection();
  };

  const processDetectedSpeech = (text: string) => {
    // Analyze the speech for legal triggers
    const detectedTip = legalSpeechAnalyzer.analyzeSpeech(text);
    
    if (detectedTip) {
      console.log(`🔍 Detected legal trigger: "${text}" - Category: ${detectedTip.category}, Urgency: ${detectedTip.urgency}`);
      
      setDetectedPhrases(prev => [...prev.slice(-4), text]); // Keep last 5 phrases
      setTipHistory(prev => [...prev, detectedTip]);
      setCurrentTip(detectedTip);
      
      // Clear any existing timeout
      if (tipTimeoutRef.current) {
        clearTimeout(tipTimeoutRef.current);
      }
      
      // Speak the tip if enabled
      if (speakTips) {
        speakTip(detectedTip);
      }
      
      // Notify parent component
      onTipDetected?.(detectedTip);
      
      // Auto-hide tip after duration based on urgency
      const hideDelay = detectedTip.urgency === 'high' ? 12000 : detectedTip.urgency === 'medium' ? 10000 : 8000;
      tipTimeoutRef.current = setTimeout(() => {
        if (currentTip?.id === detectedTip.id) {
          setCurrentTip(null);
        }
      }, hideDelay);
    }
  };

  const detectPhrase = (phrase: string, tip: LegalTip) => {
    console.log(`🔍 Detected phrase: "${phrase}" - Category: ${tip.category}, Urgency: ${tip.urgency}`);
    
    setDetectedPhrases(prev => [...prev.slice(-4), phrase]); // Keep last 5 phrases
    setTipHistory(prev => [...prev, tip]);
    setCurrentTip(tip);
    
    // Clear any existing timeout
    if (tipTimeoutRef.current) {
      clearTimeout(tipTimeoutRef.current);
    }
    
    // Speak the tip if enabled
    if (speakTips) {
      speakTip(tip);
    }
    
    // Notify parent component
    onTipDetected?.(tip);
    
    // Auto-hide tip after duration based on urgency
    const hideDelay = tip.urgency === 'high' ? 12000 : tip.urgency === 'medium' ? 10000 : 8000;
    tipTimeoutRef.current = setTimeout(() => {
      if (currentTip?.id === tip.id) {
        setCurrentTip(null);
      }
    }, hideDelay);
  };

  const speakTip = (tip: LegalTip) => {
    try {
      // Stop any current speech
      Speech.stop();
      
      // Clean the tip text for better speech synthesis
      const cleanTip = tip.tip.replace(/[📋🔍🚗🚨❓🍺🗺️✋🛡️⚖️🔒📖📱📜]/g, '').trim();
      
      const speechOptions = {
        language: 'en-US',
        pitch: tip.urgency === 'high' ? 1.15 : 1.0,
        rate: tip.urgency === 'high' ? 0.85 : 0.8,
        quality: 'enhanced' as const,
        volume: tip.urgency === 'high' ? 0.9 : 0.8,
      };
      
      // Add urgency prefix for critical situations
      let speechText = '';
      if (tip.urgency === 'high') {
        speechText = `Important legal guidance: ${cleanTip}`;
      } else if (tip.urgency === 'medium') {
        speechText = `Legal tip: ${cleanTip}`;
      } else {
        speechText = `Legal guidance: ${cleanTip}`;
      }
      
      Speech.speak(speechText, speechOptions);
    } catch (error) {
      console.error('Failed to speak tip:', error);
    }
  };

  const showTipAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideTipAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#22C55E';
      default: return '#FFFFFF';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'lightbulb';
      default: return 'info';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rights': return 'gavel';
      case 'search': return 'search';
      case 'detention': return 'security';
      case 'documentation': return 'description';
      case 'immigration': return 'public';
      case 'general': return 'info';
      default: return 'help';
    }
  };

  const dismissTip = () => {
    if (tipTimeoutRef.current) {
      clearTimeout(tipTimeoutRef.current);
    }
    setCurrentTip(null);
  };

  if (!isRecording) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Current Tip Display */}
      {showText && currentTip && (
        <Animated.View 
          style={[
            styles.tipContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              borderLeftColor: getUrgencyColor(currentTip.urgency)
            }
          ]}
        >
          <View style={styles.tipHeader}>
            <MaterialIcons 
              name={getCategoryIcon(currentTip.category) as any} 
              size={18} 
              color={getUrgencyColor(currentTip.urgency)} 
            />
            <Text style={[
              styles.tipCategory,
              textStyles.caption,
              {
                fontSize: getResponsiveFontSize('caption', width) * 0.9,
                color: getUrgencyColor(currentTip.urgency),
                marginLeft: 8,
                flex: 1
              }
            ]}>
              LEGAL GUIDANCE • {currentTip.category.toUpperCase()}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={dismissTip}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={[
            styles.tipText,
            textStyles.bodyMedium,
            {
              fontSize: getResponsiveFontSize('bodyMedium', width),
              lineHeight: getResponsiveFontSize('bodyMedium', width) * typography.lineHeight.normal,
              color: '#FFFFFF'
            }
          ]}>
            {currentTip.tip}
          </Text>

          {/* Urgency and Audio Indicators */}
          <View style={styles.tipFooter}>
            <View style={styles.urgencyIndicator}>
              <MaterialIcons 
                name={getUrgencyIcon(currentTip.urgency) as any} 
                size={12} 
                color={getUrgencyColor(currentTip.urgency)} 
              />
              <Text style={[
                styles.urgencyText,
                textStyles.caption,
                {
                  fontSize: getResponsiveFontSize('caption', width) * 0.8,
                  color: getUrgencyColor(currentTip.urgency),
                  marginLeft: 4
                }
              ]}>
                {currentTip.urgency.toUpperCase()}
              </Text>
            </View>
            
            {speakTips && (
              <View style={styles.audioIndicator}>
                <MaterialIcons name="volume-up" size={12} color="#22C55E" />
                <Text style={[
                  styles.audioText,
                  textStyles.caption,
                  {
                    fontSize: getResponsiveFontSize('caption', width) * 0.8,
                    color: '#22C55E',
                    marginLeft: 4
                  }
                ]}>
                  SPOKEN
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* AI Status Indicator */}
      <View style={[
        styles.statusIndicator,
        { opacity: showText ? 1 : 0.7 }
      ]}>
        <View style={[
          styles.listeningDot,
          { backgroundColor: isListening ? '#22C55E' : '#666666' }
        ]} />
        <Text style={[
          styles.statusText,
          textStyles.caption,
          {
            fontSize: getResponsiveFontSize('caption', width) * 0.8,
            color: isListening ? '#22C55E' : '#CCCCCC',
            marginLeft: 6
          }
        ]}>
          AI {isListening ? 'MONITORING' : 'STANDBY'} • {tipHistory.length} TIPS
        </Text>
        
        {speakTips && (
          <MaterialIcons 
            name="volume-up" 
            size={12} 
            color={isListening ? '#22C55E' : '#666666'} 
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  
  tipContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  tipCategory: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  tipText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 12,
  },
  
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  urgencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  urgencyText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  audioText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  statusText: {
    fontFamily: typography.fontFamily.primary,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
});