
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Digital Passport Photo App", headerStyle: { backgroundColor: '#BBDEFB' }, headerTintColor: 'white' }} />
    </Stack>
  );
}
