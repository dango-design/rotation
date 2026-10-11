import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toast } from '@/components/Toast';
import { StoreProvider, useStore } from '@/lib/store';
import { C } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bg }}>
      <StoreProvider>
        <StatusBar style="dark" />
        {/* If the fonts can't load, the app still opens with the system fonts. */}
        {(fontsLoaded || fontError) && <App />}
      </StoreProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  const st = useStore();
  useEffect(() => {
    if (st.ready) SplashScreen.hideAsync();
  }, [st.ready]);
  // Screens read the saved closet, so they render once it has loaded.
  if (!st.ready) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        {/* The canvas screen takes the whole screen, so a drag never pulls the screen down by accident. */}
        <Stack.Screen name="builder" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="item/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="compare/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="list" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
      <Toast />
    </>
  );
}
