import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', flex: 1, marginRight: 10 }} adjustsFontSizeToFit numberOfLines={1}>
        Digital Passport Photo
      </Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/', params: { openHelper: true } })} style={{ padding: 5 }}>
        <Ionicons name="help-circle-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default function RootLayout() {
  return (
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
  );
}
