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
    <TouchableOpacity onPress={() => router.replace({ pathname: '/', params: { tab: 'processed' } })} style={{ marginLeft: 10, padding: 5 }}>
      <Ionicons name="chevron-back" size={24} color="white" />
    </TouchableOpacity>
  );
};

const HeaderTitle = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setShowHelp } = useAppState();

  const handleHelpPress = () => {
    setShowHelp(true);
    router.push('/');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: insets.right + 10 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', flex: 1, marginRight: 5 }} adjustsFontSizeToFit numberOfLines={1}>
        Digital Passport Photo
      </Text>
      <TouchableOpacity 
        onPress={handleHelpPress} 
        style={{ padding: 10 }} 
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="help-circle-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>
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
            headerStyle: { backgroundColor: '#198ff0ff' },
            headerTintColor: 'white',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="index" options={{ headerBackVisible: false, headerTitle: () => <HeaderTitle /> }} />
          <Stack.Screen name="adjust_photo" options={{ title: "Adjust Photo", headerBackVisible: true }} />
          <Stack.Screen 
            name="share_print" 
            options={{ 
              title: "Share & Print", 
              headerLeft: () => <CustomBackButton />,
            }} 
          />
        </Stack>
      </GestureHandlerRootView>
    </AppStateContext.Provider>
  );
}
