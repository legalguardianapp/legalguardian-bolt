import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  location: boolean;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    location: false,
  });

  const [hasAllRequired, setHasAllRequired] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    // Check if all required permissions are granted
    const allGranted = permissions.camera && permissions.microphone;
    setHasAllRequired(allGranted);
  }, [permissions]);

  const checkPermissions = async () => {
    try {
      // Check camera permission
      const cameraStatus = await Camera.getCameraPermissionsAsync();
      
      // Check microphone permission
      const audioStatus = await Audio.getPermissionsAsync();
      
      // Check location permission
      const locationStatus = await Location.getForegroundPermissionsAsync();

      setPermissions({
        camera: cameraStatus.granted,
        microphone: audioStatus.granted,
        location: locationStatus.granted,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Request camera permission
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      
      // Request microphone permission
      const audioResult = await Audio.requestPermissionsAsync();
      
      // Request location permission (optional)
      const locationResult = await Location.requestForegroundPermissionsAsync();

      const newPermissions = {
        camera: cameraResult.granted,
        microphone: audioResult.granted,
        location: locationResult.granted,
      };

      setPermissions(newPermissions);

      // Check if required permissions are granted
      const requiredGranted = newPermissions.camera && newPermissions.microphone;

      if (!requiredGranted) {
        // Show alert for missing required permissions
        const missingPermissions = [];
        if (!newPermissions.camera) missingPermissions.push('Camera');
        if (!newPermissions.microphone) missingPermissions.push('Microphone');

        Alert.alert(
          'Permissions Required',
          `Legal Guardian needs ${missingPermissions.join(' and ')} access to record legal protection sessions. Please grant these permissions in your device settings.`,
          [{ text: 'OK' }]
        );
      }

      return requiredGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Permission Error',
        'Failed to request permissions. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  return {
    permissions,
    hasAllRequired,
    requestPermissions,
    checkPermissions,
  };
}

// Default export for compatibility
export default usePermissions;