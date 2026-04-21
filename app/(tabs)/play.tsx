// This route exists so Expo Router registers a "play" tab, but the tab button
// in (tabs)/_layout.tsx intercepts the press and opens the /game-setup modal
// instead — so this screen should never actually render.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function PlayRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/game-setup');
  }, [router]);
  return <View style={styles.blank} />;
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: '#fafafa' },
});
