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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const { width: W, height: H } = Dimensions.get('window');
const IS_TINY = H < 680;
const IS_SMALL = H < 750;

const STORAGE_KEY = 'gbull_unlocked_level_v1';
const TOTAL_LEVELS = 15;

const GRID_SIZE = 5;
const TIME_LIMIT_SEC = 60;

const BG_LEVELS = require('../assets/background_game.png');
const ICON_BACK = require('../assets/icon_back.png');
const TILE_FRAME = require('../assets/level_frame.png');

const BG_GAME = require('../assets/background_game.png');
const ICON_PAUSE = require('../assets/icon_pause.png');

const BULL = require('../assets/bull_target.png');

const POPUP_PANEL = require('../assets/popup_panel.png');
const BTN_CONTINUE = require('../assets/btn_continue.png');
const BTN_HOME = require('../assets/btn_home.png');
const BTN_RETRY = require('../assets/btn_retry.png');

const IMG_VICTORY = require('../assets/victory.png');
const IMG_GAMEOVER = require('../assets/gameover.png');
const BTN_NEXT = require('../assets/btn_next_level.png');
const BTN_SHARE = require('../assets/btn_share.png');

const ARROW_IMG = {
  U: require('../assets/block_up.png'),
  R: require('../assets/block_right.png'),
  D: require('../assets/block_down.png'),
  L: require('../assets/block_left.png'),
} as const;

type Mode = 'levels' | 'play';
type Result = 'none' | 'win' | 'lose';
type Dir = keyof typeof ARROW_IMG;

type Cell =
  | { kind: 'arrow'; dir: Dir }
  | { kind: 'bull' };

function idx(r: number, c: number) {
  return r * GRID_SIZE + c;
}
function inBounds(r: number, c: number) {
  return r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE;
}
function dirDelta(d: Dir) {
  if (d === 'U') return [-1, 0] as const;
  if (d === 'R') return [0, 1] as const;
  if (d === 'D') return [1, 0] as const;
  return [0, -1] as const;
}
function formatTime(sec: number) {
  const s = Math.max(0, sec);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
function rotateDir(d: Dir): Dir {
  if (d === 'U') return 'R';
  if (d === 'R') return 'D';
  if (d === 'D') return 'L';
  return 'U';
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}
function randDir(rng: () => number): Dir {
  const v = Math.floor(rng() * 4);
  return v === 0 ? 'U' : v === 1 ? 'R' : v === 2 ? 'D' : 'L';
}

function levelBoard(lvl: number): { board: Cell[]; bullPos: { r: number; c: number } } {
  const rng = makeRng(12345 + lvl * 999);

  let bullR = Math.floor(rng() * GRID_SIZE);
  let bullC = Math.floor(rng() * GRID_SIZE);
  if (bullR === 0 && bullC === 0) bullC = 1;

  const b: Cell[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
    kind: 'arrow' as const,
    dir: randDir(rng),
  }));

  b[idx(0, 0)] = { kind: 'arrow', dir: randDir(rng) };
  b[idx(bullR, bullC)] = { kind: 'bull' };

  return { board: b, bullPos: { r: bullR, c: bullC } };
}

function reachesBullFromStart(board: Cell[]): boolean {
  let r = 0;
  let c = 0;
  const visited = new Set<number>();

  for (let step = 0; step < GRID_SIZE * GRID_SIZE + 10; step++) {
    if (!inBounds(r, c)) return false;

    const id = idx(r, c);
    if (visited.has(id)) return false;
    visited.add(id);

    const cell = board[id];
    if (cell.kind === 'bull') return true;

    const [dr, dc] = dirDelta(cell.dir);
    r += dr;
    c += dc;
  }
  return false;
}

export default function GameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('levels');
  const [unlocked, setUnlocked] = useState<number>(1);

  const [level, setLevel] = useState<number>(1);
  const [{ board, bullPos }, setBoardState] = useState(() => levelBoard(1));

  const [paused, setPaused] = useState<boolean>(false);
  const [result, setResult] = useState<Result>('none');

  const [remain, setRemain] = useState<number>(TIME_LIMIT_SEC);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeLevels = useRef(new Animated.Value(1)).current;
  const fadePlay = useRef(new Animated.Value(0)).current;
  const gridIn = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;

  const cellAnim = useRef<Record<number, Animated.Value>>({}).current;
  const ensureCellAnim = useCallback(
    (i: number) => {
      if (!cellAnim[i]) cellAnim[i] = new Animated.Value(1);
      return cellAnim[i];
    },
    [cellAnim]
  );

  const animateEnterPlay = useCallback(() => {
    fadePlay.setValue(0);
    gridIn.setValue(0);
    Animated.parallel([
      Animated.timing(fadePlay, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gridIn, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.back(1.08)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadePlay, gridIn]);

  const animateEnterLevels = useCallback(() => {
    fadeLevels.setValue(0);
    Animated.timing(fadeLevels, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeLevels]);

  const showPopup = useCallback(() => {
    pop.setValue(0);
    Animated.timing(pop, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const hidePopup = useCallback(
    (cb?: () => void) => {
      Animated.timing(pop, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) cb?.();
      });
    },
    [pop]
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setRemain(prev => {
        if (prev <= 1) {
          stopTimer();
          setResult('lose');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const loadProgress = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const v = raw ? Number(raw) : 1;
      setUnlocked(Number.isFinite(v) && v >= 1 ? v : 1);
    } catch {
      setUnlocked(1);
    }
  }, []);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  useEffect(() => {
    if (paused || result !== 'none') showPopup();
  }, [paused, result, showPopup]);

  useEffect(() => {
    if (mode === 'play') animateEnterPlay();
    if (mode === 'levels') animateEnterLevels();
  }, [mode, animateEnterLevels, animateEnterPlay]);

  const TOP = insets.top + 18;
  const HUD_PAD_H = Math.min(16, Math.max(12, W * 0.04));

  const COLS = 3;
  const GAP = IS_TINY ? 10 : 12;
  const TILE = Math.min((W - 40 - GAP * (COLS - 1)) / COLS, IS_TINY ? 86 : 98);

  const GRID_W = Math.min(W * 0.78, 334);
  const CELL = Math.floor((GRID_W - (IS_TINY ? 10 : 12) * (GRID_SIZE - 1)) / GRID_SIZE);

  const levels = useMemo(() => Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1), []);

  const goLevels = useCallback(() => {
    stopTimer();
    setPaused(false);
    setResult('none');
    setMode('levels');
  }, [stopTimer]);

  const unlockNext = useCallback(
    async (currentLevel: number) => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const curUnlocked = raw ? Number(raw) : 1;

        const next = Math.min(currentLevel + 1, TOTAL_LEVELS);
        const newUnlocked = Math.max(curUnlocked || 1, next);

        await AsyncStorage.setItem(STORAGE_KEY, String(newUnlocked));
        setUnlocked(newUnlocked);
      } catch {}
    },
    []
  );

  const startLevel = useCallback(
    (lvl: number) => {
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) ensureCellAnim(i).setValue(1);

      const next = levelBoard(lvl);
      setLevel(lvl);
      setBoardState(next);

      setPaused(false);
      setResult('none');
      setRemain(TIME_LIMIT_SEC);

      setMode('play');
      startTimer();
    },
    [ensureCellAnim, startTimer]
  );

  const onTapCell = useCallback(
    (r: number, c: number) => {
      if (paused || result !== 'none') return;

      const i = idx(r, c);
      const cell = board[i];
      if (cell.kind === 'bull') return;

      const v = ensureCellAnim(i);
      v.setValue(0.92);
      Animated.timing(v, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      setBoardState(prev => {
        const copy = [...prev.board];
        const cur = copy[i];
        if (cur.kind === 'arrow') {
          copy[i] = { kind: 'arrow', dir: rotateDir(cur.dir) };
        }

        const win = reachesBullFromStart(copy);
        if (win) {
          stopTimer();
          unlockNext(level);
          setResult('win');
        }

        return { board: copy, bullPos: prev.bullPos };
      });
    },
    [board, ensureCellAnim, level, paused, result, stopTimer, unlockNext]
  );

  const onPause = useCallback(() => {
    if (result !== 'none') return;
    stopTimer();
    setPaused(true);
  }, [result, stopTimer]);

  const onContinue = useCallback(() => {
    hidePopup(() => {
      setPaused(false);
      startTimer();
    });
  }, [hidePopup, startTimer]);

  const onRetry = useCallback(() => {
    hidePopup(() => {
      setPaused(false);
      setResult('none');

      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) ensureCellAnim(i).setValue(1);

      const next = levelBoard(level);
      setBoardState(next);
      setRemain(TIME_LIMIT_SEC);
      startTimer();
    });
  }, [ensureCellAnim, hidePopup, level, startTimer]);

  const onHome = useCallback(() => {
    hidePopup(() => {
      stopTimer();
      setPaused(false);
      setResult('none');
      setMode('levels');
      navigation.navigate('Menu');
    });
  }, [hidePopup, navigation, stopTimer]);

  const onNextLevel = useCallback(() => {
    const next = Math.min(level + 1, TOTAL_LEVELS);
    hidePopup(() => startLevel(next));
  }, [hidePopup, level, startLevel]);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: `Golden Bull Escape — I completed Level ${level}!` });
    } catch {}
  }, [level]);

  return (
    <View style={{ flex: 1 }}>
      {mode === 'levels' && (
        <ImageBackground source={BG_LEVELS} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fadeLevels }}>
            <View style={[styles.topBar, { paddingTop: TOP }]}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                hitSlop={10}
              >
                <Image source={ICON_BACK} style={styles.backIcon} />
              </Pressable>

              <Text style={styles.title}>Levels</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.gridWrap}>
              <View style={{ gap: GAP }}>
                {Array.from({ length: Math.ceil(TOTAL_LEVELS / COLS) }, (_, row) => {
                  const rowItems = levels.slice(row * COLS, row * COLS + COLS);
                  return (
                    <View key={row} style={{ flexDirection: 'row', gap: GAP, justifyContent: 'center' }}>
                      {rowItems.map(lvl => {
                        const isOpen = lvl <= unlocked;
                        return (
                          <Pressable
                            key={lvl}
                            disabled={!isOpen}
                            onPress={() => startLevel(lvl)}
                            style={({ pressed }) => [
                              { width: TILE, height: TILE },
                              pressed && isOpen && { transform: [{ scale: 0.98 }], opacity: 0.92 },
                            ]}
                          >
                            <ImageBackground source={TILE_FRAME} style={styles.tileBg} resizeMode="contain">
                              <Text style={[styles.tileText, !isOpen && { opacity: 0.35 }]}>{lvl}</Text>
                              {!isOpen && <View style={styles.lockOverlay} />}
                            </ImageBackground>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </ImageBackground>
      )}

      {mode === 'play' && (
        <ImageBackground source={BG_GAME} style={styles.bg} resizeMode="cover">
          <Animated.View style={{ flex: 1, opacity: fadePlay }}>
            <View style={[styles.hud, { paddingTop: TOP, paddingHorizontal: HUD_PAD_H }]}>
              <Pressable
                onPress={goLevels}
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
                hitSlop={10}
              >
                <Image source={ICON_BACK} style={styles.backIcon} />
              </Pressable>

              <View style={styles.centerHud}>
                <Text style={styles.lvl}>LVL {level}</Text>
                <Text style={styles.time}>{formatTime(remain)}</Text>
              </View>

              <Pressable
                onPress={onPause}
                style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]}
                hitSlop={10}
              >
                <Image source={ICON_PAUSE} style={styles.pauseIcon} />
              </Pressable>
            </View>

            <View style={styles.gameWrap}>
              <Animated.View
                style={{
                  opacity: gridIn,
                  transform: [{ scale: gridIn.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                }}
              >
                <View style={[styles.board, { width: GRID_W, gap: IS_TINY ? 10 : 12 }]}>
                  {board.map((cell, i) => {
                    const r = Math.floor(i / GRID_SIZE);
                    const c = i % GRID_SIZE;

                    const v = ensureCellAnim(i);

                    const isStart = r === 0 && c === 0;
                    const isBull = cell.kind === 'bull';

                    const tileSource = isBull ? TILE_FRAME : ARROW_IMG[cell.dir];

                    return (
                      <Pressable
                        key={i}
                        onPress={() => onTapCell(r, c)}
                        style={({ pressed }) => [
                          { width: CELL, height: CELL },
                          pressed && !isBull && { transform: [{ scale: 0.985 }], opacity: 0.92 },
                        ]}
                      >
                        <Animated.View style={{ width: '100%', height: '100%', transform: [{ scale: v }] }}>
                          <ImageBackground source={tileSource} style={styles.tileCell} resizeMode="contain">
                            {isBull && <Image source={BULL} style={styles.bullInCell} resizeMode="contain" />}

                            {isStart && (
                              <View pointerEvents="none" style={styles.startMark}>
                                <Text style={styles.startText}>START</Text>
                              </View>
                            )}
                          </ImageBackground>
                        </Animated.View>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={styles.hint}>
                  Bull: ({bullPos.r + 1},{bullPos.c + 1})
                </Text>
              </Animated.View>
            </View>

            <Modal visible={paused || result !== 'none'} transparent animationType="none">
              <View style={styles.modalOverlay}>
                <Animated.View
                  style={[
                    styles.popupWrap,
                    {
                      opacity: pop,
                      transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
                    },
                  ]}
                >
                  {result === 'win' && <Image source={IMG_VICTORY} style={styles.resultImg} resizeMode="contain" />}
                  {result === 'lose' && <Image source={IMG_GAMEOVER} style={styles.resultImg} resizeMode="contain" />}

                  <ImageBackground source={POPUP_PANEL} style={styles.panel} resizeMode="contain">
                    {paused && result === 'none' && (
                      <>
                        <Pressable onPress={onContinue} style={({ pressed }) => [styles.imgBtn, pressed && styles.pressed]}>
                          <Image source={BTN_CONTINUE} style={styles.bigBtnImg} resizeMode="contain" />
                        </Pressable>

                        <View style={styles.row}>
                          <Pressable onPress={onHome} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                            <Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" />
                          </Pressable>
                          <Pressable onPress={onRetry} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                            <Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" />
                          </Pressable>
                        </View>
                      </>
                    )}

                    {result === 'win' && (
                      <>
                        <Pressable onPress={onNextLevel} style={({ pressed }) => [styles.imgBtn, pressed && styles.pressed]}>
                          <Image source={BTN_NEXT} style={styles.bigBtnImg} resizeMode="contain" />
                        </Pressable>

                        <View style={styles.row}>
                          <Pressable onPress={onHome} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                            <Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" />
                          </Pressable>
                          <Pressable onPress={onRetry} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                            <Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" />
                          </Pressable>
                        </View>
                      </>
                    )}

                    {result === 'lose' && (
                      <View style={styles.row}>
                        <Pressable onPress={onHome} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                          <Image source={BTN_HOME} style={styles.smallBtnImg} resizeMode="contain" />
                        </Pressable>
                        <Pressable onPress={onRetry} style={({ pressed }) => [styles.smallImgBtn, pressed && styles.pressed]}>
                          <Image source={BTN_RETRY} style={styles.smallBtnImg} resizeMode="contain" />
                        </Pressable>
                      </View>
                    )}
                  </ImageBackground>

                  {result === 'win' && (
                    <Pressable onPress={onShare} style={({ pressed }) => [styles.shareWrap, pressed && styles.pressed]}>
                      <Image source={BTN_SHARE} style={styles.shareImg} resizeMode="contain" />
                    </Pressable>
                  )}
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
  title: { flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: '800' },

  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  backIcon: { width: 38, height: 38, resizeMode: 'contain' },

  gridWrap: { flex: 1, paddingHorizontal: 20, paddingTop: IS_SMALL ? 14 : 18, alignItems: 'center' },
  tileBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontSize: 26, fontWeight: '900', color: '#2B1200', marginTop: 2, zIndex: 2 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(120,120,120,0.55)', borderRadius: 14 },

  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centerHud: { alignItems: 'center' },
  lvl: { color: '#F5B14C', fontWeight: '900', fontSize: IS_TINY ? 22 : 26 },
  time: { color: '#fff', fontWeight: '900', fontSize: IS_TINY ? 28 : 32, marginTop: 6 },

  pauseBtn: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pauseIcon: { width: 38, height: 38, resizeMode: 'contain' },

  gameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: IS_TINY ? 10 : 16 },
  board: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },

  tileCell: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  bullInCell: { width: '76%', height: '76%' },

  startMark: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    height: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  hint: { marginTop: 10, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  popupWrap: { alignItems: 'center' },
  resultImg: { width: Math.min(W * 0.78, 360), height: Math.min(W * 0.4, 180), marginBottom: 8 },
  panel: { width: Math.min(W * 0.64, 280), paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },

  imgBtn: { marginBottom: 12 },
  bigBtnImg: { width: Math.min(W * 0.52, 240), height: Math.min(W * 0.16, 72) },

  row: { flexDirection: 'row', gap: 12, marginTop: 2 },
  smallImgBtn: {},
  smallBtnImg: { width: Math.min(W * 0.22, 96), height: Math.min(W * 0.16, 70) },

  shareWrap: { marginTop: 10 },
  shareImg: { width: Math.min(W * 0.6, 270), height: Math.min(W * 0.16, 72) },
});
