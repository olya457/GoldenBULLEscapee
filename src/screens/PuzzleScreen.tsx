import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Pressable,
  Dimensions,
  Modal,
  Animated,
  Easing,
  Share,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Puzzle'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 680;
const IS_VERY_SMALL = H < 620;

const STORAGE_KEY = 'gbull_puzzle_unlocked_v2';

const BG = require('../assets/background_game.png');
const ICON_PAUSE = require('../assets/icon_pause.png');
const ICON_BACK = require('../assets/icon_back.png');

const POPUP_PANEL = require('../assets/popup_panel.png');
const BTN_HOME = require('../assets/btn_home.png');
const BTN_RETRY = require('../assets/btn_retry.png');
const BTN_NEXT = require('../assets/btn_next_level.png');
const BTN_SHARE = require('../assets/btn_share.png');
const BTN_CONTINUE = require('../assets/btn_continue.png');

const IMG_VICTORY = require('../assets/victory.png');
const IMG_GAMEOVER = require('../assets/gameover.png');

const PUZZLES = [
  { id: 1, title: 'Puzzle 1', preview: require('../assets/p1_full.png'), pieces: [require('../assets/p1_1.png'), require('../assets/p1_2.png'), require('../assets/p1_3.png'), require('../assets/p1_4.png'), require('../assets/p1_5.png'), require('../assets/p1_6.png'), require('../assets/p1_7.png'), require('../assets/p1_8.png'), require('../assets/p1_9.png')] },
  { id: 2, title: 'Puzzle 2', preview: require('../assets/p2_full.png'), pieces: [require('../assets/p2_1.png'), require('../assets/p2_2.png'), require('../assets/p2_3.png'), require('../assets/p2_4.png'), require('../assets/p2_5.png'), require('../assets/p2_6.png'), require('../assets/p2_7.png'), require('../assets/p2_8.png'), require('../assets/p2_9.png')] },
  { id: 3, title: 'Puzzle 3', preview: require('../assets/p3_full.png'), pieces: [require('../assets/p3_1.png'), require('../assets/p3_2.png'), require('../assets/p3_3.png'), require('../assets/p3_4.png'), require('../assets/p3_5.png'), require('../assets/p3_6.png'), require('../assets/p3_7.png'), require('../assets/p3_8.png'), require('../assets/p3_9.png')] },
  { id: 4, title: 'Puzzle 4', preview: require('../assets/p4_full.png'), pieces: [require('../assets/p4_1.png'), require('../assets/p4_2.png'), require('../assets/p4_3.png'), require('../assets/p4_4.png'), require('../assets/p4_5.png'), require('../assets/p4_6.png'), require('../assets/p4_7.png'), require('../assets/p4_8.png'), require('../assets/p4_9.png')] },
  { id: 5, title: 'Puzzle 5', preview: require('../assets/p5_full.png'), pieces: [require('../assets/p5_1.png'), require('../assets/p5_2.png'), require('../assets/p5_3.png'), require('../assets/p5_4.png'), require('../assets/p5_5.png'), require('../assets/p5_6.png'), require('../assets/p5_7.png'), require('../assets/p5_8.png'), require('../assets/p5_9.png')] },
  { id: 6, title: 'Puzzle 6', preview: require('../assets/p6_full.png'), pieces: [require('../assets/p4_1.png'), require('../assets/p4_2.png'), require('../assets/p4_3.png'), require('../assets/p4_4.png'), require('../assets/p4_5.png'), require('../assets/p4_6.png'), require('../assets/p4_7.png'), require('../assets/p4_8.png'), require('../assets/p4_9.png')] },
  { id: 7, title: 'Puzzle 7', preview: require('../assets/p7_full.png'), pieces: [require('../assets/p1_1.png'), require('../assets/p1_2.png'), require('../assets/p1_3.png'), require('../assets/p1_4.png'), require('../assets/p1_5.png'), require('../assets/p1_6.png'), require('../assets/p1_7.png'), require('../assets/p1_8.png'), require('../assets/p1_9.png')] },
  { id: 8, title: 'Puzzle 8', preview: require('../assets/p8_full.png'), pieces: [require('../assets/p2_1.png'), require('../assets/p2_2.png'), require('../assets/p2_3.png'), require('../assets/p2_4.png'), require('../assets/p2_5.png'), require('../assets/p2_6.png'), require('../assets/p2_7.png'), require('../assets/p2_8.png'), require('../assets/p2_9.png')] },
  { id: 9, title: 'Puzzle 9', preview: require('../assets/p9_full.png'), pieces: [require('../assets/p3_1.png'), require('../assets/p3_2.png'), require('../assets/p3_3.png'), require('../assets/p3_4.png'), require('../assets/p3_5.png'), require('../assets/p3_6.png'), require('../assets/p3_7.png'), require('../assets/p3_8.png'), require('../assets/p3_9.png')] },
  { id: 10, title: 'Puzzle 10', preview: require('../assets/p10_full.png'), pieces: [require('../assets/p1_1.png'), require('../assets/p1_2.png'), require('../assets/p1_3.png'), require('../assets/p1_4.png'), require('../assets/p1_5.png'), require('../assets/p1_6.png'), require('../assets/p1_7.png'), require('../assets/p1_8.png'), require('../assets/p1_9.png')] },
] as const;

type Mode = 'list' | 'play';
type Result = 'none' | 'win' | 'lose';

function formatTime(sec: number) {
  const s = Math.max(0, sec);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function isSolved(order: number[]) {
  for (let i = 0; i < 9; i++) if (order[i] !== i) return false;
  return true;
}

function shuffleOrder(seed: number) {
  const arr = Array.from({ length: 9 }, (_, i) => i);
  let s = (seed * 9301 + 49297) % 233280;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (isSolved(arr)) { [arr[0], arr[1]] = [arr[1], arr[0]]; }
  return arr;
}

function timeForLevel(id: number) {
  if (id === 1) return 30;
  if (id === 2) return 20;
  if (id === 3) return 15;
  return 10;
}

export default function PuzzleScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('list');
  const [unlocked, setUnlocked] = useState<number>(1);
  const [activePuzzle, setActivePuzzle] = useState<number>(1);
  const [started, setStarted] = useState<boolean>(false);
  const [order, setOrder] = useState<number[]>(() => shuffleOrder(1));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [result, setResult] = useState<Result>('none');
  const [remain, setRemain] = useState<number>(timeForLevel(1));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fade = useRef(new Animated.Value(1)).current;
  const listIn = useRef(new Animated.Value(0)).current;
  const playHudIn = useRef(new Animated.Value(0)).current;
  const previewIn = useRef(new Animated.Value(0)).current;
  const gridIn = useRef(new Animated.Value(0)).current;
  const startIn = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const cellPulse = useRef<Record<number, Animated.Value>>({}).current;
  const ensureCellPulse = useCallback((i: number) => {
    if (!cellPulse[i]) cellPulse[i] = new Animated.Value(1);
    return cellPulse[i];
  }, [cellPulse]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setRemain(prev => {
        if (prev <= 1) { stopTimer(); setResult('lose'); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const goToMenu = useCallback(() => {
    stopTimer();
    setPaused(false);
    setResult('none');
    setStarted(false);
    setSelectedIdx(null);
    navigation.navigate('Menu');
  }, [navigation, stopTimer]);

  const resetEntryAnims = useCallback(() => {
    listIn.setValue(0); playHudIn.setValue(0); previewIn.setValue(0); gridIn.setValue(0); startIn.setValue(0);
  }, [gridIn, listIn, playHudIn, previewIn, startIn]);

  const animateFade = useCallback(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade]);

  const animateListEnter = useCallback(() => {
    listIn.setValue(0);
    Animated.timing(listIn, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [listIn]);

  const animatePlayEnter = useCallback(() => {
    playHudIn.setValue(0); previewIn.setValue(0); gridIn.setValue(0); startIn.setValue(0);
    Animated.sequence([
      Animated.timing(playHudIn, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(previewIn, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(gridIn, { toValue: 1, duration: 360, easing: Easing.out(Easing.back(1.02)), useNativeDriver: true }),
      ]),
      Animated.timing(startIn, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [gridIn, playHudIn, previewIn, startIn]);

  const showPopup = useCallback(() => {
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [pop]);

  const hidePopup = useCallback((cb?: () => void) => {
    Animated.timing(pop, { toValue: 0, duration: 170, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) cb?.();
    });
  }, [pop]);

  useEffect(() => {
    resetEntryAnims();
    animateFade();
    if (mode === 'list') animateListEnter();
    if (mode === 'play') animatePlayEnter();
  }, [activePuzzle, animateFade, animateListEnter, animatePlayEnter, mode, resetEntryAnims]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    if (paused || result !== 'none') showPopup();
  }, [paused, result, showPopup]);

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const v = raw ? Number(raw) : 1;
      setUnlocked(Number.isFinite(v) && v >= 1 ? Math.min(v, PUZZLES.length) : 1);
    } catch { setUnlocked(1); }
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);
  useFocusEffect(useCallback(() => { loadProgress(); }, [loadProgress]));

  const unlockNext = useCallback(async (cur: number) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const curUnlocked = raw ? Number(raw) : 1;
      const next = Math.min(cur + 1, PUZZLES.length);
      const newUnlocked = Math.max(curUnlocked || 1, next);
      await AsyncStorage.setItem(STORAGE_KEY, String(newUnlocked));
      setUnlocked(newUnlocked);
    } catch {}
  }, []);

  const puzzleData = useMemo(() => PUZZLES.find(p => p.id === activePuzzle)!, [activePuzzle]);

  const resetStateForPuzzle = useCallback((id: number) => {
    stopTimer();
    setActivePuzzle(id);
    setMode('play');
    setPaused(false);
    setResult('none');
    setStarted(false);
    setSelectedIdx(null);
    setRemain(timeForLevel(id));
    setOrder(shuffleOrder(id));
    for (let i = 0; i < 9; i++) ensureCellPulse(i).setValue(1);
  }, [ensureCellPulse, stopTimer]);

  const onStart = useCallback(() => {
    if (started) return;
    setStarted(true);
    setRemain(timeForLevel(activePuzzle));
    startTimer();
  }, [activePuzzle, startTimer, started]);

  const onPause = useCallback(() => {
    if (!started || result !== 'none') return;
    stopTimer();
    setPaused(true);
  }, [result, started, stopTimer]);

  const onContinue = useCallback(() => {
    hidePopup(() => { setPaused(false); startTimer(); });
  }, [hidePopup, startTimer]);

  const onRestart = useCallback(() => {
    hidePopup(() => resetStateForPuzzle(activePuzzle));
  }, [activePuzzle, hidePopup, resetStateForPuzzle]);

  const onNext = useCallback(() => {
    const next = Math.min(activePuzzle + 1, PUZZLES.length);
    hidePopup(() => resetStateForPuzzle(next));
  }, [activePuzzle, hidePopup, resetStateForPuzzle]);

  const onTapCell = useCallback((cellIndex: number) => {
    if (!started || paused || result !== 'none') return;
    const pulse = ensureCellPulse(cellIndex);
    pulse.setValue(0.94);
    Animated.timing(pulse, { toValue: 1, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    setSelectedIdx(prev => {
      if (prev === null) return cellIndex;
      if (prev === cellIndex) return null;
      setOrder(cur => {
        const copy = [...cur];
        [copy[prev], copy[cellIndex]] = [copy[cellIndex], copy[prev]];
        if (isSolved(copy)) { stopTimer(); setResult('win'); unlockNext(activePuzzle); }
        return copy;
      });
      return null;
    });
  }, [activePuzzle, ensureCellPulse, paused, result, started, stopTimer, unlockNext]);

  const TOP = insets.top + (IS_VERY_SMALL ? 10 : 18);
  const HUD_PAD_H = Math.min(16, Math.max(12, W * 0.04));
  const GRID_GAP = IS_VERY_SMALL ? 7 : IS_TINY ? 8 : 10;
  const GRID_W = Math.min(W * (IS_VERY_SMALL ? 0.86 : 0.78), IS_VERY_SMALL ? 318 : IS_TINY ? 310 : 340);
  const CELL = Math.floor((GRID_W - GRID_GAP * 2) / 3);
  const PREVIEW = Math.min(W * (IS_VERY_SMALL ? 0.30 : 0.34), IS_VERY_SMALL ? 92 : IS_TINY ? 106 : 135);

  const listAnimStyle = { opacity: listIn, transform: [{ translateY: listIn.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] };
  const hudAnimStyle = { opacity: playHudIn, transform: [{ translateY: playHudIn.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] };
  const previewAnimStyle = { opacity: previewIn, transform: [{ scale: previewIn.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] };
  const gridAnimStyle = { opacity: gridIn, transform: [{ scale: gridIn.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] };
  const startAnimStyle = { opacity: startIn, transform: [{ translateY: startIn.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }, { scale: startIn.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) }] };

  return (
    <View style={{ flex: 1 }}>
      {mode === 'list' && (
        <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <View style={[styles.topBar, { paddingTop: TOP }]}>
              <Pressable onPress={goToMenu} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} hitSlop={10}>
                <Image source={ICON_BACK} style={styles.iconImg} />
              </Pressable>
              <Text style={styles.title}>Puzzle</Text>
              <View style={{ width: 44 }} />
            </View>
            <Animated.View style={[{ flex: 1 }, listAnimStyle]}>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 10, paddingBottom: insets.bottom + 18, gap: IS_VERY_SMALL ? 12 : 14 }} showsVerticalScrollIndicator={false}>
                {PUZZLES.map(p => {
                  const isOpen = p.id <= unlocked;
                  return (
                    <Pressable key={p.id} disabled={!isOpen} onPress={() => resetStateForPuzzle(p.id)} style={({ pressed }) => [styles.card, !isOpen && { opacity: 0.55 }, pressed && isOpen && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}>
                      <Image source={p.preview} style={styles.cardPreview} resizeMode="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, IS_VERY_SMALL && { fontSize: 15 }]}>{p.title}</Text>
                        <Text style={styles.cardSub}>{isOpen ? `Time: ${timeForLevel(p.id)}s` : 'Locked'}</Text>
                      </View>
                      <View style={styles.badge}><Text style={styles.badgeText}>{p.id}</Text></View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </ImageBackground>
      )}

      {mode === 'play' && (
        <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fade }}>
            <Animated.View style={[styles.hud, { paddingTop: TOP, paddingHorizontal: HUD_PAD_H }, hudAnimStyle]}>
              <Pressable onPress={goToMenu} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} hitSlop={10}>
                <Image source={ICON_BACK} style={styles.iconImg} />
              </Pressable>
              <View style={styles.centerHud}>
                <Text style={styles.lvl}>PUZZLE {activePuzzle}</Text>
                <Text style={styles.time}>{formatTime(remain)}</Text>
              </View>
              <Pressable onPress={onPause} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} hitSlop={10}>
                <Image source={ICON_PAUSE} style={styles.iconImg} />
              </Pressable>
            </Animated.View>
            <Animated.View style={[{ alignItems: 'center', marginTop: IS_VERY_SMALL ? 8 : IS_TINY ? 10 : 14 }, previewAnimStyle]}>
              <Image source={puzzleData.preview} style={{ width: PREVIEW, height: PREVIEW, borderRadius: 14 }} resizeMode="cover" />
            </Animated.View>
            {!started && (
              <Animated.View style={[styles.startWrap, startAnimStyle]}>
                <Pressable onPress={onStart} style={({ pressed }) => [styles.startBtn, { width: Math.min(W * 0.44, 200), height: IS_VERY_SMALL ? 40 : 50 }, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
                  <Text style={[styles.startBtnText, IS_VERY_SMALL && { fontSize: 15 }]}>Start</Text>
                </Pressable>
              </Animated.View>
            )}
            <View style={[styles.gameWrap, { paddingBottom: insets.bottom + 14 }]}>
              <Animated.View style={[{ width: GRID_W }, gridAnimStyle]}>
                <View style={[styles.grid, { gap: GRID_GAP }]}>
                  {order.map((pieceIndex, cellIndex) => {
                    const v = ensureCellPulse(cellIndex);
                    const selected = selectedIdx === cellIndex;
                    return (
                      <Pressable key={cellIndex} onPress={() => onTapCell(cellIndex)} style={({ pressed }) => [{ width: CELL, height: CELL }, pressed && started && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}>
                        <Animated.View style={{ flex: 1, transform: [{ scale: v }] }}>
                          <Image source={puzzleData.pieces[pieceIndex]} style={[styles.piece, { width: CELL, height: CELL, borderRadius: Math.max(10, Math.floor(CELL * 0.16)), borderWidth: selected ? 3 : 0, borderColor: selected ? 'rgba(255,215,140,0.95)' : 'transparent' }]} resizeMode="cover" />
                        </Animated.View>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.hint, { marginTop: 14 }]}>Swap two tiles. Finish before time ends.</Text>
              </Animated.View>
            </View>

            <Modal visible={paused || result !== 'none'} transparent animationType="none">
              <View style={styles.modalOverlay}>
                <Animated.View style={[styles.popupWrap, { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
                  {result === 'win' && <Image source={IMG_VICTORY} style={styles.resultImg} resizeMode="contain" />}
                  {result === 'lose' && <Image source={IMG_GAMEOVER} style={styles.resultImg} resizeMode="contain" />}
                  <ImageBackground source={POPUP_PANEL} style={styles.panel} resizeMode="contain">
                    {(paused && result === 'none') && (
                      <>
                        <Pressable onPress={onContinue} style={({ pressed }) => [styles.imgBtn, pressed && styles.pressed]}><Image source={BTN_CONTINUE} style={styles.bigBtnImg} resizeMode="contain" /></Pressable>
                        <View style={styles.row}>
                          <Pressable onPress={goToMenu} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                          <Pressable onPress={onRestart} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                        </View>
                      </>
                    )}
                    {result === 'win' && (
                      <>
                        <Pressable onPress={activePuzzle < PUZZLES.length ? onNext : goToMenu} style={({ pressed }) => [styles.imgBtn, pressed && styles.pressed]}><Image source={BTN_NEXT} style={styles.bigBtnImg} resizeMode="contain" /></Pressable>
                        <View style={styles.row}>
                          <Pressable onPress={goToMenu} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                          <Pressable onPress={onRestart} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                        </View>
                      </>
                    )}
                    {result === 'lose' && (
                      <View style={styles.row}>
                        <Pressable onPress={goToMenu} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                        <Pressable onPress={onRestart} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}><Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" /></Pressable>
                      </View>
                    )}
                  </ImageBackground>
                </Animated.View>
              </View>
            </Modal>
          </Animated.View>
        </ImageBackground>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  pressed: { opacity: 0.85 },
  topBar: { paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 22, fontWeight: '900' },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centerHud: { alignItems: 'center' },
  lvl: { color: '#F5B14C', fontWeight: '900', fontSize: 24 },
  time: { color: '#fff', fontWeight: '900', fontSize: 32, marginTop: 6 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconImg: { width: 38, height: 38, resizeMode: 'contain' },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  cardPreview: { width: 62, height: 62, borderRadius: 14 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  badge: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F5B14C', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#2B1200', fontWeight: '900' },
  startWrap: { alignItems: 'center', marginTop: 14 },
  startBtn: { borderRadius: 14, backgroundColor: '#F5B14C', alignItems: 'center', justifyContent: 'center' },
  startBtnText: { color: '#2B1200', fontWeight: '900', fontSize: 16 },
  gameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  piece: { backgroundColor: 'rgba(0,0,0,0.1)' },
  hint: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  popupWrap: { alignItems: 'center' },
  resultImg: { width: 280, height: 120, marginBottom: 10 },
  panel: { width: 280, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  imgBtn: { marginBottom: 10 },
  bigBtnImg: { width: 200, height: 60 },
  row: { flexDirection: 'row', gap: 10 },
  smallImgBtn: {},
  smallBtnImg: { width: 80, height: 60 },
});