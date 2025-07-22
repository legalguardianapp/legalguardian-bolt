import { Platform } from 'react-native';
import { safeStorage, storageUtils } from '@/utils/storage';
import * as FileSystem from 'expo-file-system';
import SessionStorage from './SessionStorage';

export interface SessionData {
  id: string;
  date: string;
  time: string;
  duration: string;
  snippet: string;
  status: 'Complete' | 'Processing' | 'Failed';
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  audioUrl?: string;
  audioBlob?: Blob;
  transcript?: string;
  aiAnalysis?: {
    summary: string;
    whatWentWell: string[];
    areasForImprovement: string[];
    legalTips: string[];
    situationType: string;
    riskLevel: 'low' | 'medium' | 'high';
    recommendedActions: string[];
    legalRedFlags: string[];
    confidence: number;
    analysisTimestamp: Date;
    requiresLegalAttention?: boolean;
    lawyerRecommendation?: string;
    urgencyLevel?: 'normal' | 'urgent' | 'critical';
  };
  processingSteps?: {
    recording: boolean;
    transcription: boolean;
    analysis: boolean;
  };
  createdAt?: number; // Timestamp for sorting
  isRealSession?: boolean; // Flag to distinguish real sessions from placeholders
}

class SessionManager {
  private static instance: SessionManager;
  private sessions: SessionData[] = [];
  private listeners: ((sessions: SessionData[]) => void)[] = [];
  private currentSession: SessionData | null = null;
  private recordingStartTime: number = 0;
  private storageKey = 'legal_guardian_sessions';
  private isInitialized = false;
  private sessionStorage: SessionStorage;
  private aiAnalysisService: AIAnalysisService;

  private constructor() {
    // Initialize storage in a safe way
    this.sessionStorage = SessionStorage.getInstance();
    this.aiAnalysisService = AIAnalysisService.getInstance();
    this.initializeStorage();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Initialize storage in a web-safe way
   */
  private async initializeStorage() {
    if (this.isInitialized) return;
    
    try {
      await this.loadSessionsFromStorage();
      
      // Initialize with mock data if no sessions exist
      if (this.sessions.length === 0) {
        await this.initializeMockData();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      this.sessions = [];
      this.isInitialized = true;
    }
  }

  /**
   * Load sessions from storage (web-safe)
   */
  private async loadSessionsFromStorage() {
    try {
      // Load placeholder sessions
      const placeholderSessions = await storageUtils.getJSON<SessionData[]>(this.storageKey, []);
      
      // Load real sessions
      const realSessions = await this.sessionStorage.getSessions();
      
      // Combine and sort by creation time
      this.sessions = [...realSessions, ...placeholderSessions]
        .filter((session: any) => session.id && session.date)
        .sort((a: SessionData, b: SessionData) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
      this.sessions = [];
    }
  }

  /**
   * Save sessions to storage (web-safe)
   */
  private async saveSessionsToStorage() {
    try {
      // Filter out real sessions (they're stored separately)
      const placeholderSessions = this.sessions.filter(s => !s.isRealSession);
      await storageUtils.setJSON(this.storageKey, placeholderSessions);
    } catch (error) {
      console.error('Failed to save sessions to storage:', error);
    }
  }

  /**
   * Initialize with mock data for demonstration
   */
  private async initializeMockData() {
    const now = new Date();
    this.sessions = [
      {
        id: '1',
        date: 'January 15, 2025',
        time: '3:14 PM',
        duration: '2:34',
        snippet: 'Police stop interaction - ID verification request. You maintained composure and clearly stated your rights. AI analysis shows excellent communication throughout.',
        status: 'Complete',
        quality: 'Excellent',
        audioUrl: 'mock-audio-1',
        createdAt: now.getTime() - 86400000, // 1 day ago
        transcript: 'Officer: Can I see your ID? User: Am I being detained or am I free to go? Officer: This is just a routine check. User: I understand, but I need to know if I\'m being detained. Officer: You\'re not being detained, but I\'d appreciate your cooperation. User: I understand. Here is my identification. I want to make it clear that I am recording this interaction for both of our protection. Officer: That\'s fine. Thank you for your cooperation.',
        aiAnalysis: {
          summary: 'This was a police stop regarding ID verification. You handled the interaction professionally and maintained your composure throughout. Your approach demonstrated good knowledge of your rights while remaining cooperative.',
          whatWentWell: [
            'Stayed calm and composed throughout the interaction',
            'Clearly asked about detention status before complying',
            'Maintained respectful tone while asserting rights',
            'Successfully documented the entire interaction',
            'Informed officer about recording for transparency'
          ],
          areasForImprovement: [
            'Could have asked for officer\'s badge number and name earlier',
            'Consider stating your name more clearly at the beginning',
            'Practice the phrase "I do not consent to searches" for future use',
            'Ask about the specific reason for the stop'
          ],
          legalTips: [
            'Always ask "Am I being detained?" to clarify your legal status',
            'You have the right to remain silent beyond providing basic identification',
            'Recording police interactions is legal in most jurisdictions',
            'Stay calm and avoid sudden movements during any police encounter',
            'You can ask for the officer\'s name and badge number',
            'If not detained, you have the right to leave'
          ],
          situationType: 'Police Stop',
          riskLevel: 'medium',
          recommendedActions: [
            'Document the interaction details while fresh in memory',
            'Note the officer\'s badge number and patrol car number',
            'Save this recording in a secure location',
            'Consider filing a complaint if rights were violated'
          ],
          legalRedFlags: [],
          confidence: 0.92,
          analysisTimestamp: new Date(),
          requiresLegalAttention: false,
          lawyerRecommendation: '',
          urgencyLevel: 'normal'
        },
        processingSteps: {
          recording: true,
          transcription: true,
          analysis: true
        }
      },
      {
        id: '2',
        date: 'January 12, 2025',
        time: '11:22 AM',
        duration: '4:12',
        snippet: 'Traffic stop documentation - Speeding citation. Good communication with officer, proper document handling. Room for improvement in asserting recording rights.',
        status: 'Complete',
        quality: 'Good',
        audioUrl: 'mock-audio-2',
        createdAt: now.getTime() - 259200000, // 3 days ago
        transcript: 'Officer: Do you know why I pulled you over? User: No, officer, I don\'t. Officer: I clocked you going 45 in a 35 mph zone. License and registration please. User: Here you go. Officer: Thank you. I\'ll be right back with you. User: Officer, may I ask your name and badge number? Officer: Officer Johnson, badge 1247. User: Thank you. I want you to know I\'m recording this interaction. Officer: That\'s your right. Here\'s your citation.',
        aiAnalysis: {
          summary: 'Traffic stop for speeding violation. You cooperated appropriately while maintaining your rights. Good job asking for officer identification and informing about recording.',
          whatWentWell: [
            'Provided required documents promptly',
            'Remained polite and cooperative throughout',
            'Asked for officer\'s name and badge number',
            'Informed officer about recording the interaction',
            'Did not admit guilt when asked about speeding'
          ],
          areasForImprovement: [
            'Could have informed officer about recording at the very beginning',
            'Ask about the specific speed measurement method used',
            'Request to see the radar/lidar reading if applicable',
            'Ask about calibration records for speed measurement device'
          ],
          legalTips: [
            'You can ask to see the speed measurement device reading',
            'Inform officers you are recording for safety purposes early on',
            'Sign the citation - it\'s not an admission of guilt',
            'You have the right to question the accuracy of speed measurement',
            'Ask about the last calibration date of speed detection equipment',
            'Take note of weather and traffic conditions'
          ],
          situationType: 'Traffic Stop',
          riskLevel: 'low',
          recommendedActions: [
            'Review the citation details carefully',
            'Consider contesting if you believe the speed reading was inaccurate',
            'Document weather and traffic conditions',
            'Consult with traffic attorney if needed'
          ],
          legalRedFlags: [],
          confidence: 0.88,
          analysisTimestamp: new Date(),
          requiresLegalAttention: false,
          lawyerRecommendation: '',
          urgencyLevel: 'normal'
        },
        processingSteps: {
          recording: true,
          transcription: true,
          analysis: true
        }
      }
    ];
    await this.saveSessionsToStorage();
  }

  public addListener(listener: (sessions: SessionData[]) => void) {
    this.listeners.push(listener);
  }

  public removeListener(listener: (sessions: SessionData[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.sessions]));
  }

  public async getSessions(): Promise<SessionData[]> {
    // Ensure storage is initialized
    if (!this.isInitialized) {
      await this.initializeStorage();
    }
    return [...this.sessions];
  }

  /**
   * Start a new recording session
   */
  public startSession(metadata: {
    location?: { latitude: number; longitude: number; address: string };
    customTitle?: string;
  }): SessionData {
    // Create a new session
    const now = new Date();
    const sessionId = `session_${now.getTime()}`;
    
    this.currentSession = {
      id: sessionId,
      date: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      duration: '00:00',
      snippet: 'Recording in progress...',
      status: 'Processing',
      quality: 'Good',
      createdAt: now.getTime(),
      isRealSession: true, // Mark as a real session
    };
    
    this.recordingStartTime = now.getTime();
    
    console.log('Session started:', this.currentSession);
    
    return this.currentSession;
  }

  /**
   * End the current recording session
   */
  public async endSession(): Promise<SessionData | null> {
    if (!this.currentSession) {
      console.error('No active session to end');
      return null;
    }
    
    const now = new Date();
    const durationMs = now.getTime() - this.recordingStartTime;
    const durationSec = Math.floor(durationMs / 1000);
    
    // Update session with duration and status
    this.currentSession.duration = this.formatDuration(durationSec);
    this.currentSession.snippet = 'Processing session analysis...';
    this.currentSession.status = 'Processing';
    
    // Add to sessions array
    this.sessions.unshift(this.currentSession);
    
    // Save real session to persistent storage
    if (this.currentSession.isRealSession) {
      await this.sessionStorage.saveSession(this.currentSession);
    } else {
      await this.saveSessionsToStorage();
    }
    
    this.notifyListeners();
    
    const endedSession = { ...this.currentSession };
    this.currentSession = null;
    this.recordingStartTime = 0;
    
    console.log('Session ended:', endedSession);
    
    return endedSession;
  }

  /**
   * Get current session data
   */
  public getSessionData(): SessionData | null {
    if (!this.currentSession) {
      return null;
    }
    
    // Update duration if session is active
    if (this.recordingStartTime > 0) {
      const now = new Date();
      const durationMs = now.getTime() - this.recordingStartTime;
      const durationSec = Math.floor(durationMs / 1000);
      this.currentSession.duration = this.formatDuration(durationSec);
    }
    
    return { ...this.currentSession };
  }

  /**
   * Save session with recording data
   */
  public async saveSession(duration: number, audioUri?: string): Promise<SessionData> {
    const now = new Date();
    const sessionId = `session_${now.getTime()}`;
    
    // Create initial session data
    const newSession: SessionData = {
      id: sessionId,
      date: now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      duration: this.formatDuration(duration),
      snippet: 'Processing session analysis...',
      status: 'Processing',
      quality: 'Good',
      audioUrl: audioUri || `recording_${sessionId}`,
      createdAt: Date.now(),
      isRealSession: true, // Mark as a real session
      processingSteps: {
        recording: true,
        transcription: false,
        analysis: false
      }
    };

    // Add to sessions array
    this.sessions.unshift(newSession);
    
    // Save to persistent storage
    await this.sessionStorage.saveSession(newSession);
    
    this.notifyListeners();

    // Simulate AI analysis with mock data
    setTimeout(async () => {
      try {
        // Step 1: Mock transcription
        const transcript = await this.generateMockTranscript();
        
        await this.updateSessionProgress(sessionId, {
          transcript,
          processingSteps: {
            recording: true,
            transcription: true,
            analysis: false
          }
        });

        // Step 2: Mock analysis
        const analysis = await this.generateMockAnalysis(transcript, duration);
        
        // Step 3: Complete session
        const updatedSession: Partial<SessionData> = {
          snippet: analysis.summary,
          status: 'Complete',
          quality: this.determineQuality(analysis.confidence),
          aiAnalysis: analysis,
          processingSteps: {
            recording: true,
            transcription: true,
            analysis: true
          }
        };

        await this.updateSessionProgress(sessionId, updatedSession);
      } catch (error) {
        await this.updateSessionProgress(sessionId, {
          snippet: 'Analysis failed. Please try again.',
          status: 'Failed',
          quality: 'Poor'
        });
      }
    }, 3000);

    return newSession;
  }

  /**
   * Update session progress during processing
   */
  private async updateSessionProgress(sessionId: string, updates: Partial<SessionData>) {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      const session = this.sessions[index];
      this.sessions[index] = { ...session, ...updates };
      
      // Update in persistent storage if it's a real session
      if (session.isRealSession) {
        await this.sessionStorage.updateSession(sessionId, updates);
      } else {
        await this.saveSessionsToStorage();
      }
      
      this.notifyListeners();
    }
  }

  private async generateMockTranscript(): Promise<string> {
    const transcripts = [
      'User: Hello, I want to make it clear that I am recording this interaction for legal protection purposes. Officer: That\'s fine. Can I see your identification? User: Am I being detained or am I free to go? Officer: This is just a routine check. User: I understand, but I need to know my legal status. Officer: You\'re not being detained. User: Thank you for clarifying. Here is my identification.',
      'Supervisor: We need to discuss your overtime hours. User: I\'d like to record this conversation for accuracy. Supervisor: Fine. You\'ve been working too much overtime. User: Can you clarify the company policy on overtime limits? Supervisor: The policy has changed. User: Could I get that policy change in writing? Supervisor: I\'ll send it to you.',
      'Store Manager: You can\'t return this item without a receipt. User: I\'m recording this conversation. I purchased this yesterday and have the credit card statement. Manager: Store policy requires a receipt. User: Can you check your system with my credit card? Manager: Let me see what I can do. User: I appreciate your help. What\'s your name for my records?',
      'Landlord: You\'re behind on rent. User: I want to record this discussion. I paid on time according to my lease. Landlord: The payment was late. User: My lease says rent is due by the 5th, and I paid on the 3rd. Landlord: Let me check my records. User: I have my bank statement showing the payment date.',
      'Insurance Agent: We\'re denying your claim. User: I\'m recording this call. Can you explain why? Agent: The damage isn\'t covered under your policy. User: Which specific clause excludes this damage? Agent: I\'ll need to review the policy details. User: Please provide that information in writing.',
      'Officer: Step out of the vehicle. User: Why am I being ordered to exit? Officer: I need to search the car. User: I do not consent to any searches. Officer: We have probable cause. User: I want to speak to a lawyer. Officer: You\'re under arrest.',
      'ICE Agent: Are you a US citizen? User: I choose to remain silent about my immigration status. Agent: Show me your green card. User: I want to speak to an immigration lawyer. Agent: Open the door, we need to come in. User: I do not consent to entry without a judicial warrant.'
    ];
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const transcript = transcripts[Math.floor(Math.random() * transcripts.length)];
        resolve(transcript);
      }, 1000);
    });
  }

  /**
   * Generate mock analysis
   */
  private async generateMockAnalysis(transcript: string, duration: number): Promise<SessionData['aiAnalysis']> {
    const scenarios = [
      {
        summary: 'Police interaction regarding routine questioning. You demonstrated good knowledge of your rights and maintained professional communication throughout the encounter.',
        situationType: 'Police Stop',
        riskLevel: 'medium' as const,
        whatWentWell: [
          'Clearly asked about detention status before complying',
          'Maintained respectful tone while asserting rights',
          'Informed officer about recording for transparency',
          'Stayed calm and composed throughout interaction',
          'Provided required identification when legally obligated'
        ],
        areasForImprovement: [
          'Could have asked for officer badge number earlier',
          'Consider stating your name more clearly at the beginning',
          'Ask about the specific reason for the stop',
          'Request written documentation if citations are issued'
        ],
        legalTips: [
          'Always ask "Am I being detained?" to clarify your legal status',
          'You have the right to remain silent beyond providing basic identification',
          'Recording police interactions is legal in most jurisdictions',
          'Stay calm and avoid sudden movements during encounters',
          'You can ask for the officer\'s name and badge number',
          'If not detained, you have the right to leave'
        ],
        legalRedFlags: [
          'Officer initially avoided answering detention question directly',
          'No clear reason provided for the initial stop'
        ],
        recommendedActions: [
          'Document the interaction details while fresh in memory',
          'Note the officer\'s badge number and patrol car number',
          'Save this recording in a secure location',
          'Consider filing a complaint if rights were violated'
        ],
        requiresLegalAttention: false
      },
      {
        summary: 'Workplace incident involving policy discussion with supervisor. You maintained professionalism and properly documented the conversation.',
        situationType: 'Workplace Dispute',
        riskLevel: 'medium' as const,
        whatWentWell: [
          'Requested to record the conversation for accuracy',
          'Asked for clarification on policy changes',
          'Maintained professional demeanor throughout',
          'Requested written confirmation of new policies',
          'Stayed focused on facts rather than emotions'
        ],
        areasForImprovement: [
          'Could have requested HR presence for policy discussions',
          'Ask for specific policy document references',
          'Request meeting summary in writing',
          'Consider involving union representative if applicable'
        ],
        legalTips: [
          'Document all workplace policy discussions',
          'Request written confirmation of policy changes',
          'Know your rights regarding overtime compensation',
          'HR should be involved in significant policy disputes',
          'Keep records of all work-related communications',
          'Understand your state\'s labor laws'
        ],
        legalRedFlags: [
          'Policy change mentioned without proper written notice',
          'Supervisor seemed reluctant to provide documentation'
        ],
        recommendedActions: [
          'Follow up with HR about the policy discussion',
          'Request written copy of the new overtime policy',
          'Document any changes to your work schedule',
          'Consult with employment attorney if needed'
        ],
        requiresLegalAttention: true,
        lawyerRecommendation: 'Consider consulting with an employment lawyer to review workplace policy changes and ensure your rights are protected.',
        urgencyLevel: 'normal' as const
      },
      {
        summary: 'Consumer rights issue with store management. You effectively challenged the policy and sought reasonable resolution.',
        situationType: 'Consumer Rights',
        riskLevel: 'low' as const,
        whatWentWell: [
          'Clearly explained your position with evidence',
          'Remained calm despite initial refusal',
          'Offered alternative proof of purchase',
          'Documented the interaction by recording',
          'Sought manager involvement for resolution'
        ],
        areasForImprovement: [
          'Reference specific consumer protection laws',
          'Ask for store policy documentation',
          'Request escalation to corporate level',
          'Consider filing complaints with regulatory agencies'
        ],
        legalTips: [
          'Keep all receipts and documentation',
          'Know your consumer protection rights',
          'Document all communications with businesses',
          'Understand return and refund policies before purchasing',
          'File complaints with Better Business Bureau if needed',
          'Consider small claims court for unresolved disputes'
        ],
        legalRedFlags: [
          'Store policy may violate consumer protection laws',
          'Manager initially refused to check alternative proof'
        ],
        recommendedActions: [
          'Follow up with store corporate customer service',
          'File complaint with state consumer protection agency',
          'Keep detailed records of all communications',
          'Consider disputing charge with credit card company'
        ],
        requiresLegalAttention: false
      },
      // High-risk ICE scenario that requires urgent legal attention
      {
        summary: 'ICE encounter involving immigration status questions and potential detention threats. Critical situation requiring immediate legal intervention.',
        situationType: 'ICE Encounter',
        riskLevel: 'high' as const,
        whatWentWell: [
          'Attempted to remain silent about immigration status',
          'Tried to record the interaction',
          'Asked about warrant requirements'
        ],
        areasForImprovement: [
          'Should have been more assertive about warrant requirements',
          'Could have requested to speak through the door',
          'Should have immediately requested immigration lawyer'
        ],
        legalTips: [
          'Never open door without judicial warrant signed by judge',
          'Administrative warrants do not authorize home entry',
          'You have right to remain silent about immigration status',
          'Request immigration lawyer immediately',
          'Do not sign any documents without legal representation'
        ],
        legalRedFlags: [
          'ICE agents threatened entry without proper warrant',
          'Questions about immigration status and citizenship',
          'Pressure to sign voluntary departure documents'
        ],
        recommendedActions: [
          'Contact immigration lawyer immediately',
          'Document all details of the encounter',
          'Notify family members and community organizations',
          'Prepare emergency plan for family members'
        ],
        requiresLegalAttention: true,
        lawyerRecommendation: 'URGENT: This ICE encounter requires immediate immigration legal assistance. Contact an immigration attorney right away. Do not sign any documents without legal representation.',
        urgencyLevel: 'critical' as const
      }
    ];

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Select scenario based on transcript content for more realistic results
    let selectedScenario;
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('arrest') || lowerTranscript.includes('search') || lowerTranscript.includes('probable cause')) {
      selectedScenario = scenarios[0]; // Police scenario
    } else if (lowerTranscript.includes('ice') || lowerTranscript.includes('immigration') || lowerTranscript.includes('citizen')) {
      selectedScenario = scenarios[3]; // ICE scenario
    } else if (lowerTranscript.includes('workplace') || lowerTranscript.includes('supervisor') || lowerTranscript.includes('overtime')) {
      selectedScenario = scenarios[1]; // Workplace scenario
    } else if (lowerTranscript.includes('store') || lowerTranscript.includes('return') || lowerTranscript.includes('receipt')) {
      selectedScenario = scenarios[2]; // Consumer rights scenario
    } else {
      selectedScenario = scenarios[0]; // Default police scenario
    }

    return {
      ...selectedScenario,
      confidence: 0.9,
      analysisTimestamp: new Date()
    };
  }

  private determineQuality(confidence: number): SessionData['quality'] {
    if (confidence >= 0.9) return 'Excellent';
    if (confidence >= 0.8) return 'Good';
    if (confidence >= 0.6) return 'Fair';
    return 'Poor';
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const index = this.sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      const session = this.sessions[index];
      
      // Delete from appropriate storage
      if (session.isRealSession) {
        await this.sessionStorage.deleteSession(sessionId);
      }
      
      // Remove from in-memory array
      this.sessions.splice(index, 1);
      
      // Save placeholder sessions if needed
      if (!session.isRealSession) {
        await this.saveSessionsToStorage();
      }
      
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.find(s => s.id === sessionId);
  }

  public getLatestSession(): SessionData | undefined {
    return this.sessions[0];
  }

  /**
   * Get session statistics
   */
  public getSessionStats() {
    const total = this.sessions.length;
    const completed = this.sessions.filter(s => s.status === 'Complete').length;
    const excellent = this.sessions.filter(s => s.quality === 'Excellent').length;

    return {
      total,
      completed,
      excellent,
      processing: this.sessions.filter(s => s.status === 'Processing').length,
      failed: this.sessions.filter(s => s.status === 'Failed').length
    };
  }

  /**
   * Export session data
   */
  public exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const exportData = {
      id: session.id,
      date: session.date,
      time: session.time,
      duration: session.duration,
      transcript: session.transcript,
      analysis: session.aiAnalysis,
      quality: session.quality,
      status: session.status
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all sessions (for testing/reset)
   */
  public async clearAllSessions(): Promise<void> {
    // Clear real sessions
    await this.sessionStorage.clearAllSessions();
    
    // Clear placeholder sessions
    await storageUtils.setJSON(this.storageKey, []);
    
    // Clear in-memory sessions
    this.sessions = [];
    
    this.notifyListeners();
  }

  /**
   * Get AI service status
   */
  public getAIServiceStatus() {
    return {
      configured: true, // Mock status for demo
      analyzing: false
    };
  }
}

export default SessionManager;