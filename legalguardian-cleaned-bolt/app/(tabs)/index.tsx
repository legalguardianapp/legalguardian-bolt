import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Platform, ScrollView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { usePermissions } from '@/hooks/usePermissions';
import KnowYourRightsModal from '@/components/KnowYourRightsModal';
import AnimatedButton from '@/components/AnimatedButton';
import FadeInView from '@/components/FadeInView';
import redRecordIcon from '@/assets/redRecordIcon.png';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = width < 375; // iPhone SE and smaller
const isMediumScreen = width >= 375 && width < 414; // iPhone 12/13/14
const isLargeScreen = width >= 414; // iPhone Plus/Pro Max

export default function HomeScreen() {
  const router = useRouter();
  const { hasAllRequired, requestPermissions } = usePermissions();
  const [showRightsModal, setShowRightsModal] = useState(false);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulsing animation for CTA button
    startPulseAnimation();
  }, []);

  // Pulsing animation for the CTA button
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleStartProtection = async () => {
    if (!hasAllRequired) {
      const granted = await requestPermissions();
      if (!granted) {
        return;
      }
    }
    router.push('/(tabs)/recording');
  };

  // Responsive font sizes
  const getFontSize = (small: number, medium: number, large: number) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  // Responsive spacing
  const getSpacing = (small: number, medium: number, large: number) => {
    if (isSmallScreen) return small;
    if (isMediumScreen) return medium;
    return large;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: getSpacing(80, 100, 120) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section - Legal Guardian title */}
        <FadeInView 
          duration={800} 
          delay={150}
          style={[
            styles.header,
            { 
              paddingTop: 100, // Increased top padding
              paddingHorizontal: getSpacing(20, 30, 40),
              paddingBottom: getSpacing(60, 70, 80) // Increased bottom padding
            }
          ]}
        >
          <Text style={[
            styles.appTitle,
            { 
              fontSize: getFontSize(42, 46, 50), // Increased font size by 30%
              letterSpacing: 3,
              marginBottom: 32, // Increased vertical spacing
            }
          ]}>
            LEGAL GUARDIAN
          </Text>
          <Text style={[
            styles.appSubtitle,
            { 
              fontSize: 16,
              lineHeight: 24,
              maxWidth: '90%'
            }
          ]}>
            Protect your rights with confidence. Record, analyze, and understand your legal interactions with AI-powered insights and real-time guidance.
          </Text>
        </FadeInView>

        {/* Main CTA - Large Green Button */}
        <FadeInView 
          duration={800} 
          delay={300}
          style={[
            styles.ctaSection,
            { 
              paddingHorizontal: getSpacing(20, 30, 40),
              paddingBottom: getSpacing(90, 100, 110) // Increased bottom padding
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              width: '100%',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              style={styles.primaryButtonContainer}
              onPress={handleStartProtection}
              activeOpacity={0.8}
            >
              <Image 
                source={redRecordIcon}
                style={styles.primaryButtonImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={[
            styles.ctaSubtext,
            { 
              fontSize: 14,
              marginTop: 16, // Increased spacing below button
              opacity: 0.9 // Slightly reduced opacity for supporting text
            }
          ]}>
            Tap the record button to begin secure recording with real-time AI guidance
          </Text>
        </FadeInView>

        {/* Know Your Rights Section */}
        <FadeInView 
          duration={800} 
          delay={400}
          style={[
            styles.rightsSection,
            { 
              paddingHorizontal: getSpacing(20, 30, 40),
              paddingBottom: getSpacing(60, 70, 80)
            }
          ]}
        >
          <Text style={[
            styles.sectionTitle,
            { fontSize: getFontSize(24, 26, 28) } // Reduced font size for secondary content
          ]}>
            KNOW YOUR RIGHTS
          </Text>
          <Text style={[
            styles.sectionDescription,
            { 
              fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
              lineHeight: getFontSize(22, 24, 26)
            }
          ]}>
            Understanding your constitutional rights is the foundation of legal protection. Every citizen should know these fundamental protections before any legal interaction.
          </Text>
          
          <AnimatedButton
            style={styles.rightsButton}
            onPress={() => setShowRightsModal(true)}
            activeOpacity={0.8}
            scaleAmount={0.95}
            duration={150}
          >
            <View style={styles.rightsButtonContent}>
              <MaterialIcons name="menu-book" size={getFontSize(20, 22, 24)} color="#FFFFFF" />
              <Text style={[
                styles.rightsButtonText,
                { fontSize: getFontSize(14, 15, 16) }
              ]}>
                LEARN YOUR RIGHTS
              </Text>
              <MaterialIcons name="chevron-right" size={getFontSize(20, 22, 24)} color="#FFFFFF" />
            </View>
          </AnimatedButton>
        </FadeInView>

        {/* Features Section */}
        <FadeInView 
          duration={800} 
          delay={500}
          style={[
            styles.featuresSection,
            { 
              paddingHorizontal: getSpacing(20, 30, 40),
              paddingBottom: getSpacing(60, 70, 80)
            }
          ]}
        >
          <Text style={[
            styles.sectionTitle,
            { fontSize: getFontSize(24, 26, 28) } // Reduced font size for secondary content
          ]}>
            PROTECTION FEATURES
          </Text>
          
          <View style={styles.featuresList}>
            <View style={[styles.featureItem, { marginBottom: getSpacing(30, 35, 40) }]}>
              <Text style={[
                styles.featureTitle,
                { fontSize: getFontSize(16, 17, 18) } // Reduced font size for secondary content
              ]}>
                HD VIDEO & AUDIO RECORDING
              </Text>
              <Text style={[
                styles.featureDescription,
                { 
                  fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
                  lineHeight: getFontSize(22, 23, 24)
                }
              ]}>
                Crystal clear documentation of your interactions with high-definition video and audio recording capabilities.
              </Text>
            </View>

            <View style={[styles.featureItem, { marginBottom: getSpacing(30, 35, 40) }]}>
              <Text style={[
                styles.featureTitle,
                { fontSize: getFontSize(16, 17, 18) } // Reduced font size for secondary content
              ]}>
                GPS LOCATION TRACKING
              </Text>
              <Text style={[
                styles.featureDescription,
                { 
                  fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
                  lineHeight: getFontSize(22, 23, 24)
                }
              ]}>
                Automatic location documentation for evidence purposes, providing crucial context for your recordings.
              </Text>
            </View>

            <View style={[styles.featureItem, { marginBottom: getSpacing(30, 35, 40) }]}>
              <Text style={[
                styles.featureTitle,
                { fontSize: getFontSize(16, 17, 18) } // Reduced font size for secondary content
              ]}>
                END-TO-END ENCRYPTION
              </Text>
              <Text style={[
                styles.featureDescription,
                { 
                  fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
                  lineHeight: getFontSize(22, 23, 24)
                }
              ]}>
                Your data stays private and secure with military-grade encryption protecting all recordings and personal information.
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={[
                styles.featureTitle,
                { fontSize: getFontSize(16, 17, 18) } // Reduced font size for secondary content
              ]}>
                AI LEGAL ANALYSIS
              </Text>
              <Text style={[
                styles.featureDescription,
                { 
                  fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
                  lineHeight: getFontSize(22, 23, 24)
                }
              ]}>
                Instant feedback and personalized legal insights powered by advanced artificial intelligence technology.
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Mission Statement */}
        <FadeInView 
          duration={800} 
          delay={600}
          style={[
            styles.missionSection,
            { 
              paddingHorizontal: getSpacing(20, 30, 40),
              paddingBottom: getSpacing(60, 70, 80)
            }
          ]}
        >
          <Text style={[
            styles.missionTitle,
            { fontSize: getFontSize(24, 26, 28) } // Reduced font size for secondary content
          ]}>
            OUR MISSION
          </Text>
          <Text style={[
            styles.missionText,
            { 
              fontSize: getFontSize(14, 15, 16), // Reduced font size for body text
              lineHeight: getFontSize(24, 25, 26)
            }
          ]}>
            Every person deserves equal protection under the law. Legal Guardian empowers citizens with the tools and knowledge needed to document legal interactions, understand their rights, and ensure accountability in our justice system.
          </Text>
        </FadeInView>
      </ScrollView>

      {/* Know Your Rights Modal */}
      <KnowYourRightsModal
        visible={showRightsModal}
        onClose={() => setShowRightsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header Section - Legal Guardian title
  header: {
    alignItems: 'center',
  },
  appTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3, // Increased letter spacing
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  appSubtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // CTA Section - Large Green Button
  ctaSection: {
    alignItems: 'center',
  },
  primaryButtonContainer: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonImage: {
    width: 120,
    height: 120,
  },
  ctaSubtext: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Rights Section
  rightsSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  sectionDescription: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  rightsButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rightsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightsButtonText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginLeft: 12,
    marginRight: 12,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Features Section
  featuresSection: {
    // No additional styles needed, using responsive padding from props
  },
  featuresList: {
    // No gap property, using marginBottom on items
  },
  featureItem: {
    alignItems: 'center',
  },
  featureTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  featureDescription: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Mission Section
  missionSection: {
    alignItems: 'center',
  },
  missionTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  missionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  }
});