import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../src/styles/global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="bar/[id]" 
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

