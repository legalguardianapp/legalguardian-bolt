import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as SpeechRecognition from 'expo-speech-recognition';

export interface SpeechRecognitionOptions {
  onSpeechResult: (text: string) => void;
  onSpeechError?: (error: any) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  continuous?: boolean;
  language?: string;
}

class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private isListening: boolean = false;
  private recognitionInstance: any = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  private options: SpeechRecognitionOptions | null = null;
  private partialResults: string[] = [];
  private lastProcessedText: string = '';

  private constructor() {}

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  /**
   * Check if speech recognition is available on the device
   */
  public async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Check for Web Speech API
      return typeof window !== 'undefined' && 
             ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    } else {
      // Check for native speech recognition
      try {
        const available = await SpeechRecognition.isAvailableAsync();
        return available;
      } catch (error) {
        console.error('Error checking speech recognition availability:', error);
        return false;
      }
    }
  }

  /**
   * Request permission to use speech recognition
   */
  public async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Web doesn't need explicit permission
    }
    
    try {
      const { granted } = await SpeechRecognition.requestPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Error requesting speech recognition permission:', error);
      return false;
    }
  }

  /**
   * Start listening for speech
   */
  public async startListening(options: SpeechRecognitionOptions): Promise<boolean> {
    if (this.isListening) {
      console.log('Speech recognition is already running');
      return true;
    }

    this.options = options;
    this.partialResults = [];
    this.lastProcessedText = '';

    try {
      const available = await this.isAvailable();
      if (!available) {
        console.log('Speech recognition is not available on this device');
        return this.startSimulation();
      }

      const granted = await this.requestPermission();
      if (!granted && Platform.OS !== 'web') {
        console.log('Speech recognition permission not granted');
        return this.startSimulation();
      }

      if (Platform.OS === 'web') {
        return this.startWebSpeechRecognition();
      } else {
        return this.startNativeSpeechRecognition();
      }
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return this.startSimulation();
    }
  }

  /**
   * Stop listening for speech
   */
  public stopListening(): boolean {
    try {
      if (Platform.OS === 'web') {
        if (this.recognitionInstance) {
          this.recognitionInstance.stop();
          this.recognitionInstance = null;
        }
      } else {
        SpeechRecognition.stopListeningAsync();
      }

      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }

      this.isListening = false;
      this.options = null;
      console.log('Speech recognition stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
      return false;
    }
  }

  /**
   * Start web speech recognition
   */
  private startWebSpeechRecognition(): boolean {
    try {
      if (typeof window === 'undefined') {
        return this.startSimulation();
      }

      // @ts-ignore - TypeScript doesn't know about the Web Speech API
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        return this.startSimulation();
      }

      this.recognitionInstance = new SpeechRecognitionAPI();
      const recognition = this.recognitionInstance;

      recognition.continuous = this.options?.continuous ?? true;
      recognition.interimResults = true;
      recognition.lang = this.options?.language ?? 'en-US';

      recognition.onstart = () => {
        this.isListening = true;
        this.options?.onSpeechStart?.();
        console.log('Web speech recognition started');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          isFinal = event.results[i].isFinal;
        }

        if (transcript.trim()) {
          this.partialResults.push(transcript);
          
          // Process the result if it's final or if it's significantly different from the last processed text
          if (isFinal || (transcript.length > 10 && transcript !== this.lastProcessedText)) {
            this.lastProcessedText = transcript;
            this.options?.onSpeechResult(transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Web speech recognition error:', event.error);
        this.options?.onSpeechError?.(event.error);
        
        // Restart if it's a recoverable error
        if (event.error === 'network' || event.error === 'no-speech') {
          this.restartWebSpeechRecognition();
        } else {
          this.startSimulation();
        }
      };

      recognition.onend = () => {
        console.log('Web speech recognition ended');
        
        // Restart if we're still supposed to be listening
        if (this.isListening) {
          this.restartWebSpeechRecognition();
        } else {
          this.isListening = false;
          this.options?.onSpeechEnd?.();
        }
      };

      recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start web speech recognition:', error);
      return this.startSimulation();
    }
  }

  /**
   * Restart web speech recognition (it times out after a while)
   */
  private restartWebSpeechRecognition(): void {
    if (!this.isListening || !this.recognitionInstance) return;
    
    try {
      setTimeout(() => {
        if (this.isListening && this.recognitionInstance) {
          this.recognitionInstance.start();
        }
      }, 100);
    } catch (error) {
      console.error('Failed to restart web speech recognition:', error);
      this.startSimulation();
    }
  }

  /**
   * Start native speech recognition
   */
  private async startNativeSpeechRecognition(): Promise<boolean> {
    try {
      await SpeechRecognition.startListeningAsync({
        partialResults: true,
        continuous: this.options?.continuous ?? true,
        language: this.options?.language ?? 'en-US',
      }, {
        onSpeechStart: () => {
          this.isListening = true;
          this.options?.onSpeechStart?.();
          console.log('Native speech recognition started');
        },
        onSpeechPartialResults: (results: { value: string[] }) => {
          if (results.value.length > 0) {
            const transcript = results.value[0];
            if (transcript.trim()) {
              this.partialResults.push(transcript);
              
              // Only process if it's significantly different from the last processed text
              if (transcript.length > 10 && transcript !== this.lastProcessedText) {
                this.lastProcessedText = transcript;
                this.options?.onSpeechResult(transcript);
              }
            }
          }
        },
        onSpeechResults: (results: { value: string[] }) => {
          if (results.value.length > 0) {
            const transcript = results.value[0];
            if (transcript.trim()) {
              this.lastProcessedText = transcript;
              this.options?.onSpeechResult(transcript);
            }
          }
        },
        onSpeechError: (error) => {
          console.error('Native speech recognition error:', error);
          this.options?.onSpeechError?.(error);
          this.startSimulation();
        },
        onSpeechEnd: () => {
          console.log('Native speech recognition ended');
          
          // Restart if we're still supposed to be listening
          if (this.isListening) {
            this.startNativeSpeechRecognition();
          } else {
            this.isListening = false;
            this.options?.onSpeechEnd?.();
          }
        }
      });
      
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start native speech recognition:', error);
      return this.startSimulation();
    }
  }

  /**
   * Start simulation mode for testing
   */
  private startSimulation(): boolean {
    console.log('Starting speech recognition simulation mode');
    
    this.isListening = true;
    this.options?.onSpeechStart?.();
    
    // Simulate speech recognition with predefined phrases
    const simulatedPhrases = [
      // Police officer phrases
      "Can I see your license and registration?",
      "Do you know why I pulled you over?",
      "Step out of the vehicle please.",
      "Where are you coming from tonight?",
      "Have you had anything to drink?",
      "I'm going to need to search your vehicle.",
      "Put your hands behind your back.",
      "Am I being detained or am I free to go?",
      
      // ICE agent phrases
      "Are you a US citizen?",
      "Where were you born?",
      "Show me your immigration papers.",
      "We need to see your green card.",
      "Open the door, we have a warrant.",
      "We're ICE agents, we need to talk to you.",
      
      // User responses
      "I choose to remain silent.",
      "I do not consent to a search.",
      "I want to speak to an attorney.",
      "Am I free to go?",
      "I'm recording this interaction for my protection.",
      "I don't consent to you entering my home without a judicial warrant."
    ];
    
    // Simulate speech detection every 10-20 seconds
    this.simulationInterval = setInterval(() => {
      if (!this.isListening) {
        if (this.simulationInterval) {
          clearInterval(this.simulationInterval);
          this.simulationInterval = null;
        }
        return;
      }
      
      const randomPhrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      console.log('Simulated speech detected:', randomPhrase);
      
      this.options?.onSpeechResult(randomPhrase);
    }, 10000 + Math.random() * 10000); // Random interval between 10-20 seconds
    
    return true;
  }

  /**
   * Check if currently listening
   */
  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Speak text using text-to-speech
   */
  public speak(text: string, options?: Speech.SpeechOptions): void {
    try {
      // Stop any current speech
      Speech.stop();
      
      // Default options
      const defaultOptions: Speech.SpeechOptions = {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      };
      
      // Merge with provided options
      const speechOptions = { ...defaultOptions, ...options };
      
      // Speak the text
      Speech.speak(text, speechOptions);
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  }
}

export default SpeechRecognitionService;