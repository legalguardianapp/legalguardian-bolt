import { Platform } from 'react-native';

export interface LegalTip {
  id: string;
  trigger: string;
  tip: string;
  urgency: 'low' | 'medium' | 'high';
  category: 'rights' | 'search' | 'detention' | 'documentation' | 'general' | 'immigration';
}

class LegalSpeechAnalyzer {
  private static instance: LegalSpeechAnalyzer;
  
  // Legal tips database with comprehensive scenarios
  private readonly LEGAL_TIPS: LegalTip[] = [
    {
      id: 'id_request',
      trigger: 'license|identification|id|show me your|can i see your',
      tip: '📋 You must provide ID if driving or lawfully detained. Ask: "Am I legally required to show ID?" You can remain silent about other questions.',
      urgency: 'medium',
      category: 'documentation'
    },
    {
      id: 'search_request',
      trigger: 'search|look through|check your|mind if i search|can i search',
      tip: '🔍 Clearly state: "I do not consent to searches." Police need a warrant, probable cause, or your consent to search.',
      urgency: 'high',
      category: 'search'
    },
    {
      id: 'step_out',
      trigger: 'step out|exit the vehicle|get out of the car|out of the vehicle',
      tip: '🚗 Ask "Why am I being ordered to exit?" You must comply if ordered, but you can ask for clarification about detention.',
      urgency: 'medium',
      category: 'detention'
    },
    {
      id: 'arrest',
      trigger: 'under arrest|placing you under arrest|arresting you|you are under arrest',
      tip: '🚨 Say clearly: "I am invoking my right to remain silent and I want an attorney." Do not resist physically.',
      urgency: 'high',
      category: 'rights'
    },
    {
      id: 'why_stopped',
      trigger: 'know why|pulled you over|stopped you|reason i stopped|why i pulled',
      tip: '❓ You can say: "No officer, I don\'t know why." Admitting knowledge can be self-incriminating.',
      urgency: 'low',
      category: 'general'
    },
    {
      id: 'drinking_drugs',
      trigger: 'drinking|drugs|alcohol|substances|been using|have you been',
      tip: '🍺 You have the right to remain silent. You can say: "I choose to remain silent."',
      urgency: 'medium',
      category: 'rights'
    },
    {
      id: 'where_going',
      trigger: 'where are you going|where you coming from|what are you doing|destination',
      tip: '🗺️ You generally don\'t have to answer. Ask: "Am I free to go?" If detained, ask for the specific reason.',
      urgency: 'low',
      category: 'general'
    },
    {
      id: 'hands_behind',
      trigger: 'hands behind|put your hands|stop resisting|calm down',
      tip: '✋ Stay calm. Keep hands visible. State: "I am not resisting." Comply with physical commands while maintaining your rights.',
      urgency: 'high',
      category: 'detention'
    },
    {
      id: 'immigration_status',
      trigger: 'citizen|citizenship|immigration status|green card|papers|are you legal',
      tip: '🛡️ You have the right to remain silent about immigration status. Say: "I choose to remain silent and want to speak to a lawyer."',
      urgency: 'high',
      category: 'immigration'
    },
    {
      id: 'ice_agents',
      trigger: 'ice|immigration enforcement|homeland security|deportation|removal|open the door',
      tip: '🚨 CRITICAL: Do NOT open doors without a judicial warrant. Say: "I do not consent to entry. Show me a judicial warrant signed by a judge."',
      urgency: 'high',
      category: 'immigration'
    },
    {
      id: 'consent',
      trigger: 'consent|permission|okay if|mind if|can we|may we',
      tip: '⚖️ You have the right to refuse consent. Say: "I do not consent" clearly and calmly.',
      urgency: 'medium',
      category: 'rights'
    },
    {
      id: 'detained',
      trigger: 'detained|detaining|hold you|stay here|don\'t leave',
      tip: '🔒 Ask clearly: "Am I being detained or am I free to go?" This clarifies your legal status.',
      urgency: 'medium',
      category: 'detention'
    },
    {
      id: 'miranda_rights',
      trigger: 'right to remain silent|miranda|anything you say|used against you',
      tip: '📖 Listen carefully to your rights. Say: "I understand my rights and I want to speak to an attorney."',
      urgency: 'high',
      category: 'rights'
    },
    {
      id: 'recording',
      trigger: 'recording|camera|phone|filming|video',
      tip: '📱 You generally have the right to record police in public. State: "I am recording for both of our protection."',
      urgency: 'low',
      category: 'rights'
    },
    {
      id: 'warrant',
      trigger: 'warrant|court order|judge signed|search warrant',
      tip: '📜 Ask to see the warrant. You can say: "I want to see the warrant and speak to my attorney."',
      urgency: 'medium',
      category: 'documentation'
    },
    // User good responses
    {
      id: 'user_silence',
      trigger: 'i remain silent|right to remain silent|fifth amendment|staying silent',
      tip: '✅ Good! You\'re invoking your 5th Amendment right. State this clearly and then stop talking except to repeat your request for an attorney.',
      urgency: 'low',
      category: 'rights'
    },
    {
      id: 'user_lawyer',
      trigger: 'i want a lawyer|i want an attorney|lawyer|attorney|immigration lawyer',
      tip: '✅ Excellent! You\'re invoking your right to legal counsel. Once requested, questioning should stop until your attorney is present.',
      urgency: 'low',
      category: 'rights'
    },
    {
      id: 'user_free_to_go',
      trigger: 'am i free to go|am i being detained|am i under arrest',
      tip: '✅ Excellent question! This clarifies your legal status. If not detained, you can leave. If detained, remain calm and ask why.',
      urgency: 'low',
      category: 'detention'
    },
    {
      id: 'user_no_consent',
      trigger: 'i do not consent|i don\'t consent|no consent to search',
      tip: '✅ Perfect! You\'re asserting your 4th Amendment rights against unreasonable searches. Stay calm and repeat if necessary.',
      urgency: 'low',
      category: 'search'
    },
    {
      id: 'user_recording',
      trigger: 'recording this|i am recording|this is being recorded',
      tip: '✅ Great practice! Recording interactions is legal in most jurisdictions and provides important documentation for your protection.',
      urgency: 'low',
      category: 'general'
    }
  ];

  private constructor() {}

  public static getInstance(): LegalSpeechAnalyzer {
    if (!LegalSpeechAnalyzer.instance) {
      LegalSpeechAnalyzer.instance = new LegalSpeechAnalyzer();
    }
    return LegalSpeechAnalyzer.instance;
  }

  /**
   * Analyze speech transcript for legal triggers
   */
  public analyzeSpeech(transcript: string): LegalTip | null {
    if (!transcript || transcript.trim().length === 0) {
      return null;
    }

    const lowerTranscript = transcript.toLowerCase();
    
    // Check each legal tip for matching triggers
    for (const tip of this.LEGAL_TIPS) {
      const triggers = tip.trigger.split('|');
      
      for (const trigger of triggers) {
        if (lowerTranscript.includes(trigger.toLowerCase())) {
          console.log(`Legal trigger detected: "${trigger}" in "${lowerTranscript}"`);
          return tip;
        }
      }
    }
    
    return null;
  }

  /**
   * Get all legal tips
   */
  public getAllTips(): LegalTip[] {
    return [...this.LEGAL_TIPS];
  }

  /**
   * Get tips by category
   */
  public getTipsByCategory(category: LegalTip['category']): LegalTip[] {
    return this.LEGAL_TIPS.filter(tip => tip.category === category);
  }

  /**
   * Get tips by urgency level
   */
  public getTipsByUrgency(urgency: LegalTip['urgency']): LegalTip[] {
    return this.LEGAL_TIPS.filter(tip => tip.urgency === urgency);
  }
}

export default LegalSpeechAnalyzer;