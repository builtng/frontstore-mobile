import { useEffect, useState } from 'react';
import { View, Modal, Pressable } from 'react-native';
import * as Updates from 'expo-updates';
import { T } from './ui';

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only check in non-dev environments
    if (__DEV__) return;

    let isMounted = true;

    async function checkUpdates() {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          await Updates.fetchUpdateAsync();
          if (isMounted) {
            setUpdateAvailable(true);
          }
        }
      } catch {
        // Silently catch network or update check errors
      }
    }

    checkUpdates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      setDismissed(true);
    }
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <Modal visible={true} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-3xl bg-[#F6F3EC] p-6 shadow-2xl border border-line">
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-green/10">
            <T className="text-2xl">✨</T>
          </View>

          <T className="font-sans-bold text-xl text-ink">New Update Ready</T>
          <T className="mt-2 font-sans text-sm text-muted leading-relaxed">
            A new version of FrontStore has been downloaded. Restart the app now to enjoy the latest updates and performance improvements.
          </T>

          <View className="mt-6 flex-col gap-3">
            <Pressable
              onPress={handleRestart}
              className="h-12 w-full items-center justify-center rounded-full bg-deep active:opacity-80"
            >
              <T className="font-sans-bold text-base text-white">Restart & Apply Update</T>
            </Pressable>

            <Pressable
              onPress={() => setDismissed(true)}
              className="h-10 w-full items-center justify-center rounded-full active:opacity-60"
            >
              <T className="font-sans-medium text-sm text-muted">Later</T>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
