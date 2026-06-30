import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface VideoSplashProps {
  onFinish: () => void;
}

export function VideoSplash({ onFinish }: VideoSplashProps) {
  const finishedRef = useRef(false);

  const player = useVideoPlayer(
    require('../../../assets/video/splash-intro.mp4'),
    (p) => {
      p.muted = true;
      p.play();
      console.log('[VideoSplash] player configured, status:', p.status);
    }
  );

  useEffect(() => {
    const t0 = Date.now();
    console.log('[VideoSplash] mounted at', t0, 'duration:', player.duration, 'currentTime:', player.currentTime);

    const endSub = player.addListener('playToEnd', () => {
      console.log('[VideoSplash] playToEnd fired after', Date.now() - t0, 'ms, currentTime was:', player.currentTime);
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    });

    const statusSub = player.addListener('statusChange', (payload) => {
      console.log('[VideoSplash] statusChange:', JSON.stringify(payload), 'at +', Date.now() - t0, 'ms, duration:', player.duration);
    });

    // Safety fallback in case playToEnd never fires (e.g. video fails to load)
    const fallback = setTimeout(() => {
      console.log('[VideoSplash] fallback timeout fired, finishedRef:', finishedRef.current);
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    }, 6000);

    return () => {
      console.log('[VideoSplash] unmounted');
      endSub.remove();
      statusSub.remove();
      clearTimeout(fallback);
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: Colors.navy,
    zIndex: 999,
  },
  video: {
    width,
    height,
  },
});
