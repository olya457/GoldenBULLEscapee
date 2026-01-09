import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  Dimensions,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 680;
const IS_SMALL = H < 750;
const BG = require('../assets/background2.png');
const LOGO = require('../assets/logo2.png');

const BTN_START = require('../assets/btn_start.png');
const BTN_STORIES = require('../assets/btn_stories.png');
const BTN_PUZZLE = require('../assets/btn_puzzle.png');
const BTN_SETTINGS = require('../assets/btn_settings.png');

export default function MenuScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const topOffset = insets.top + 80;
  const bottomLift = 120;

  const sizes = useMemo(() => {
    const startW = Math.min(W * (IS_TINY ? 0.74 : IS_SMALL ? 0.76 : 0.78), IS_TINY ? 320 : 360);
    const startH = startW * 0.30;

    const mini = Math.min(W * (IS_TINY ? 0.16 : 0.18), IS_TINY ? 68 : 78);
    const gap = IS_TINY ? 10 : 14;

    return { startW, startH, mini, gap };
  }, []);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, scale]);

  const BottomStyle = useMemo(
    () => ({
      paddingBottom: Math.max(insets.bottom, 14),
      bottom: Math.max(insets.bottom, 0) + bottomLift, 
      opacity: fade,
      transform: [{ translateY: slide }, { scale }],
    }),
    [insets.bottom, fade, slide, scale]
  );

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={[styles.logoWrap, { marginTop: topOffset }]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </View>

      <Animated.View style={[styles.bottomArea, BottomStyle]}>
        <Pressable
          onPress={() => navigation.navigate('Game')}
          style={({ pressed }) => [styles.startBtn, pressed && styles.pressed]}
          android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
        >
          <Image source={BTN_START} style={{ width: sizes.startW, height: sizes.startH }} resizeMode="contain" />
        </Pressable>

        <View style={[styles.miniRow, { gap: sizes.gap }]}>
          <Pressable
            onPress={() => navigation.navigate('Stories')}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.pressed]}
            android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          >
            <Image source={BTN_STORIES} style={{ width: sizes.mini, height: sizes.mini }} resizeMode="contain" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Puzzle')}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.pressed]}
            android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          >
            <Image source={BTN_PUZZLE} style={{ width: sizes.mini, height: sizes.mini }} resizeMode="contain" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [styles.miniBtn, pressed && styles.pressed]}
            android_ripple={{ color: 'rgba(0,0,0,0.10)' }}
          >
            <Image source={BTN_SETTINGS} style={{ width: sizes.mini, height: sizes.mini }} resizeMode="contain" />
          </Pressable>
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: Math.min(W * 0.55, 240),
    height: Math.min(W * 0.55, 240),
  },

  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  startBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_TINY ? 8 : IS_SMALL ? 10 : 14,
    borderRadius: 18,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  miniBtn: {
    borderRadius: 18,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  pressed: { opacity: 0.85 },
});
