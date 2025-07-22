import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AnimatedButton from './AnimatedButton';

const { width } = Dimensions.get('window');

interface KnowYourRightsModalProps {
  visible: boolean;
  onClose: () => void;
}

type RightsCategory = 'police' | 'ice' | 'border';

export default function KnowYourRightsModal({ visible, onClose }: KnowYourRightsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<RightsCategory>('police');

  const rightsData = {
    police: {
      title: 'POLICE ENCOUNTERS',
      icon: 'local-police',
      rights: [
        {
          title: 'Right to Remain Silent',
          description: 'You have the right to remain silent. You do not have to answer questions about where you are going, where you are traveling from, what you are doing, or where you live.',
          tips: [
            'Clearly state: "I am invoking my right to remain silent"',
            'You must provide identification if lawfully detained while driving',
            'Remain calm and polite while asserting your rights'
          ]
        },
        {
          title: 'Right to Refuse Searches',
          description: 'You have the right to refuse consent to a search of yourself, your car, or your home. Police need a warrant, probable cause, or your consent.',
          tips: [
            'Clearly state: "I do not consent to any searches"',
            'Do not physically resist if they search anyway',
            'Remember what happened for later legal proceedings'
          ]
        },
        {
          title: 'Right to Know if You\'re Detained',
          description: 'You have the right to know if you are free to leave. If you are not under arrest, you have the right to calmly leave.',
          tips: [
            'Ask: "Am I being detained or am I free to go?"',
            'If not detained, you can calmly walk away',
            'If detained, ask for the specific reason'
          ]
        },
        {
          title: 'Right to an Attorney',
          description: 'If you are arrested, you have the right to an attorney. If you cannot afford one, one will be appointed for you.',
          tips: [
            'Clearly state: "I want to speak to an attorney"',
            'Do not answer questions until your attorney is present',
            'This right applies during interrogation'
          ]
        }
      ]
    },
    ice: {
      title: 'ICE ENCOUNTERS',
      icon: 'security',
      rights: [
        {
          title: 'Right to Remain Silent About Immigration Status',
          description: 'You have the right to remain silent about your immigration status, country of origin, or how you entered the United States.',
          tips: [
            'State: "I choose to remain silent about my immigration status"',
            'You do not have to show immigration documents unless at a border',
            'Ask to speak to an immigration attorney immediately'
          ]
        },
        {
          title: 'Right to Refuse Entry Without a Warrant',
          description: 'ICE cannot enter your home without a judicial warrant signed by a judge. Administrative warrants are not sufficient for home entry.',
          tips: [
            'Do not open the door without seeing a judicial warrant',
            'Ask to see the warrant through the door or window',
            'State: "I do not consent to your entry without a judicial warrant"'
          ]
        },
        {
          title: 'Right to an Immigration Attorney',
          description: 'You have the right to speak to an immigration attorney before answering questions or signing any documents.',
          tips: [
            'State: "I want to speak to an immigration lawyer"',
            'Do not sign any documents without legal representation',
            'You have the right to make a phone call'
          ]
        },
        {
          title: 'Right Against Self-Incrimination',
          description: 'You do not have to answer questions about your immigration status, criminal history, or provide information about others.',
          tips: [
            'Politely decline to answer questions',
            'Do not lie or provide false documents',
            'Remember that anything you say can be used against you'
          ]
        }
      ]
    },
    border: {
      title: 'BORDER PATROL',
      icon: 'place',
      rights: [
        {
          title: 'Rights at Border Crossings',
          description: 'At official border crossings, Border Patrol has broad authority to search and question individuals.',
          tips: [
            'You must answer questions about citizenship and identity',
            'You may be subject to search at border crossings',
            'Remain calm and cooperative while asserting available rights'
          ]
        },
        {
          title: 'Rights at Interior Checkpoints',
          description: 'At interior checkpoints away from the border, you have more rights than at actual border crossings.',
          tips: [
            'You must answer questions about citizenship',
            'You can refuse to answer other questions',
            'You can refuse consent to vehicle searches'
          ]
        },
        {
          title: 'Right to Remain Silent (Limited)',
          description: 'While you must answer citizenship questions, you can remain silent about other topics.',
          tips: [
            'Answer citizenship questions truthfully',
            'You can decline to answer other questions',
            'Ask if you are free to leave if not at a border crossing'
          ]
        },
        {
          title: 'Right to Legal Representation',
          description: 'You have the right to speak to an attorney, especially if detained for extended periods.',
          tips: [
            'Request to speak to an attorney if detained',
            'Do not sign documents without legal advice',
            'Ask for contact information for legal aid organizations'
          ]
        }
      ]
    }
  };

  const currentRights = rightsData[selectedCategory];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KNOW YOUR RIGHTS</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Category Selector */}
        <View style={styles.categorySelector}>
          {(Object.keys(rightsData) as RightsCategory[]).map((category) => (
            <AnimatedButton
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
              activeOpacity={0.8}
              scaleAmount={0.95}
              duration={150}
            >
              <MaterialIcons 
                name={rightsData[category].icon as any} 
                size={20} 
                color={selectedCategory === category ? '#000000' : '#FFFFFF'} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {rightsData[category].title}
              </Text>
            </AnimatedButton>
          ))}
        </View>

        {/* Rights Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.rightsContainer}>
            <View style={styles.categoryHeader}>
              <MaterialIcons 
                name={currentRights.icon as any} 
                size={32} 
                color="#22C55E" 
              />
              <Text style={styles.categoryTitle}>{currentRights.title}</Text>
            </View>

            {currentRights.rights.map((right, index) => (
              <View key={index} style={styles.rightCard}>
                <Text style={styles.rightTitle}>{right.title}</Text>
                <Text style={styles.rightDescription}>{right.description}</Text>
                
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Key Points:</Text>
                  {right.tips.map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipItem}>
                      <View style={styles.tipBullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Emergency Contacts */}
            <View style={styles.emergencySection}>
              <Text style={styles.emergencyTitle}>EMERGENCY LEGAL CONTACTS</Text>
              <View style={styles.emergencyCard}>
                <Text style={styles.emergencyContactTitle}>ACLU Immigrants' Rights</Text>
                <Text style={styles.emergencyContactNumber}>1-877-336-2700</Text>
              </View>
              <View style={styles.emergencyCard}>
                <Text style={styles.emergencyContactTitle}>National Immigration Hotline</Text>
                <Text style={styles.emergencyContactNumber}>1-844-363-1423</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Category Selector
  categorySelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryButtonActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  categoryButtonTextActive: {
    color: '#000000',
  },

  // Content
  content: {
    flex: 1,
  },
  rightsContainer: {
    padding: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 24,
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

  // Right Cards
  rightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  rightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
    marginBottom: 12,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  rightDescription: {
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

  // Tips
  tipsContainer: {
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },

  // Emergency Section
  emergencySection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
    letterSpacing: 1,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  emergencyCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  emergencyContactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.select({ 
      ios: 'System', 
      android: 'sans-serif', 
      default: 'System' 
    }),
  },
  emergencyContactNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});