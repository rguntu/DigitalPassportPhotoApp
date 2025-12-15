import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HelperScreen = ({ onDismiss }) => {
  console.log('HelperScreen is rendering.');
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={onDismiss}>
          <MaterialCommunityIcons name="close-circle" size={32} color="#aaa" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Welcome to the App!</Text>
        <Text style={styles.subtitle}>Here's a quick guide to the end-to-end flow:</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <MaterialCommunityIcons name="camera" size={32} color="#198ff0ff" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>1. Capture or Upload</Text>
              <Text style={styles.stepText}>Use the "Take Photo" or "Upload Photo" buttons to get started.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="image-edit" size={32} color="#198ff0ff" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>2. Adjust and Edit</Text>
              <Text style={styles.stepText}>Fine-tune your photo to meet passport requirements.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="credit-card" size={32} color="#198ff0ff" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>3. Process Payment</Text>
              <Text style={styles.stepText}>Complete payment for 6 photos.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="share-variant" size={32} color="#198ff0ff" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>4. Share and Print</Text>
              <Text style={styles.stepText}>Share your photo or print it for your passport.</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50, // Increased touch area
    height: 50, // Increased touch area
    borderRadius: 25, // Make it circular
    backgroundColor: 'rgba(0,0,0,0.1)', // For visual debugging
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it's above other content
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  stepsContainer: {
    width: '100%',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#198ff0ff',
  },
  stepText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HelperScreen;
