import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { Text, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useState, useContext } from 'react';

const AppStateContext = createContext();

export const useAppState = () => useContext(AppStateContext);

const CustomBackButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.replace({ pathname: '/', params: { tab: 'processed' } })} style={{ marginLeft: 10, padding: 5, paddingBottom: 15 }}>
      <Ionicons name="chevron-back" size={24} color="white" />
    </TouchableOpacity>
  );
};

const HeaderTitle = () => (
  <View style={{ paddingBottom: 10 }}>
    <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>ID Photo</Text>
  </View>
);

const HelpButton = () => {
  const router = useRouter();
  const { setShowHelp } = useAppState();
  const handleHelpPress = () => {
    setShowHelp(true);
    router.push('/');
  };

  return (
    <TouchableOpacity 
      onPress={handleHelpPress} 
      style={{ marginRight: 10, padding: 5, paddingBottom: 15 }} 
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="help-circle-outline" size={32} color="white" />
    </TouchableOpacity>
  );
};

export default function RootLayout() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <AppStateContext.Provider value={{ hasLaunched, setHasLaunched, showHelp, setShowHelp }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: { 
              backgroundColor: '#1d9bf0', // Primary app color
              height: 100, // Slightly taller to accommodate padding
            },
            headerTintColor: 'white',
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              headerTitle: () => <HeaderTitle />,
              headerBackVisible: false, 
              headerRight: () => <HelpButton />,
              headerRightContainerStyle: { paddingBottom: 10 },
              headerTitleContainerStyle: { paddingBottom: 10 },
            }} 
          />
          <Stack.Screen 
            name="adjust_photo" 
            options={{ 
              title: "Adjust Photo", 
              headerBackVisible: true,
              headerTitleContainerStyle: { paddingBottom: 10 },
            }} />
          <Stack.Screen 
            name="share_print" 
            options={{ 
              title: "Share & Print", 
              headerLeft: () => <CustomBackButton />,
              headerLeftContainerStyle: { paddingBottom: 10 },
              headerTitleContainerStyle: { paddingBottom: 10 },
            }} 
          />
        </Stack>
      </GestureHandlerRootView>
    </AppStateContext.Provider>
  );
}
