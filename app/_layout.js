
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Digital Passport Photo App", headerBackVisible: false, headerStyle: { backgroundColor: '#198ff0ff' }, headerTintColor: 'white', headerTitleStyle: { fontSize: 28, fontWeight: 'bold' } }} />
      <Stack.Screen name="payment" options={{ presentation: 'modal', headerShown: false }} />
    </Stack>
  );
}
