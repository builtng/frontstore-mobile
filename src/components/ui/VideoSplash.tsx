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
    }
  );

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    });

    // Safety fallback in case playToEnd never fires (e.g. video fails to load)
    const fallback = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    }, 6000);

    return () => {
      sub.remove();
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
