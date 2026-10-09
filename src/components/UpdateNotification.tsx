import { useEffect, useState, useRef } from 'react';
import { View, Pressable, AppState, AppStateStatus, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles, X } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { T } from './ui';

export function UpdateNotification() {
  const insets = useSafeAreaInsets();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [reloading, setReloading] = useState(false);
  const isCheckingRef = useRef(false);

  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const checkUpdates = async () => {
    if (__DEV__ || isCheckingRef.current || updateAvailable) return;
    try {
      isCheckingRef.current = true;
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateAvailable(true);
      }
    } catch {
      // Silently catch network or update check errors
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    if (__DEV__) return;

    // Check immediately on mount
    checkUpdates();

    // Check whenever app comes to foreground
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkUpdates();
      }
    });

    // Check every 10 minutes while app is open
    const interval = setInterval(checkUpdates, 10 * 60 * 1000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [updateAvailable]);

  useEffect(() => {
    if (updateAvailable && !dismissed) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [updateAvailable, dismissed]);

  const handleRestart = async () => {
    if (reloading) return;
    setReloading(true);
    try {
      await Updates.reloadAsync();
    } catch {
      setReloading(false);
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissed(true);
    });
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: Math.max(insets.top + 8, 16),
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        pointerEvents="auto"
        className="flex-row items-center rounded-2xl bg-ink p-3 border border-white/10"
        style={styles.toast}
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-deep border border-leaf/30 mr-3">
          <Sparkles size={18} color="#6FD3A4" />
        </View>

        <View className="flex-1 mr-2">
          <T className="font-sans-bold text-xs text-white">Update Ready</T>
          <T className="font-sans text-[11px] text-on-dark" numberOfLines={1}>
            Restart app to apply latest version
          </T>
        </View>

        <Pressable
          onPress={handleRestart}
          disabled={reloading}
          className="h-8 min-w-[68px] items-center justify-center rounded-full bg-leaf px-3 active:opacity-80"
        >
          {reloading ? (
            <ActivityIndicator size="small" color="#0E1A15" />
          ) : (
            <T className="font-sans-bold text-xs text-ink">Restart</T>
          )}
        </Pressable>

        <Pressable
          onPress={handleDismiss}
          hitSlop={10}
          className="ml-2 h-7 w-7 items-center justify-center rounded-full active:opacity-60"
        >
          <X size={16} color="#9FB3A9" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
  },
  toast: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
