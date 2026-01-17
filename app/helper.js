import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HelperScreen = ({ onDismiss }) => {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[styles.closeButton, { top: insets.top + 10 }]} onPress={onDismiss}>
          <MaterialCommunityIcons name="close" size={28} color="#0f1419" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Welcome to ID Photo!</Text>
        <Text style={styles.subtitle}>Here's a quick guide to get started:</Text>

        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <MaterialCommunityIcons name="camera" size={32} color="#1d9bf0" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>1. Capture or Upload</Text>
              <Text style={styles.stepDescription}>Use the "Take Photo" or "Upload Photo" buttons.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="image-edit" size={32} color="#1d9bf0" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>2. Adjust and Edit</Text>
              <Text style={styles.stepDescription}>Fine-tune your photo to meet passport requirements.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="credit-card" size={32} color="#1d9bf0" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>3. Process Payment</Text>
              <Text style={styles.stepDescription}>Complete payment for 6 printable photos.</Text>
            </View>
          </View>

          <View style={styles.step}>
            <MaterialCommunityIcons name="share-variant" size={32} color="#1d9bf0" />
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>4. Share and Print</Text>
              <Text style={styles.stepDescription}>Share your photo or print it immediately.</Text>
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
    backgroundColor: '#F0F5F9',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0f1419',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#536471',
  },
  stepsContainer: {
    width: '100%',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTextContainer: {
    marginLeft: 20,
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f1419',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#536471',
    lineHeight: 20,
  },
});

export default HelperScreen;
