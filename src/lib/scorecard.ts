import { writable } from 'svelte/store';
import type { HoleInfo, PlayerScore, Scorecard } from './types';

const STORAGE_KEY = 'golf-scorecard';
const MAX_HOLES = 18;
const DEFAULT_HOLES = 9;
const MAX_PLAYERS = 6;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

const createId = () => Math.random().toString(36).slice(2, 10);

const createDefaultHoles = (count: number = DEFAULT_HOLES): HoleInfo[] =>
  Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    par: 4
  }));

const createStrokesArray = (length: number): number[] =>
  Array.from({ length }, () => 0);

const createDefaultPlayer = (index: number, holeCount: number): PlayerScore => ({
  id: createId(),
  name: `Player ${index}`,
  strokes: createStrokesArray(holeCount)
});

const createDefaultScorecard = (): Scorecard => ({
  courseName: '',
  holes: createDefaultHoles(),
  players: [createDefaultPlayer(1, DEFAULT_HOLES)]
});

type PersistedHole = Partial<HoleInfo & { par: number }>;
type PersistedPlayer = Partial<PlayerScore & { strokes: number[] }>;

type LegacyScorecard = {
  courseName?: string;
  playerName?: string;
  holes?: Array<PersistedHole & { strokes?: number }>;
};

type PersistedScorecard = Partial<Scorecard> & LegacyScorecard;

const normaliseHoles = (holes: PersistedHole[] | undefined): HoleInfo[] => {
  if (!Array.isArray(holes) || holes.length === 0) {
    return createDefaultHoles();
  }

  return holes.slice(0, MAX_HOLES).map((hole, index) => ({
    number: index + 1,
    par: clamp(Number(hole?.par ?? 4), 1, 8)
  }));
};

const normaliseStrokes = (strokes: unknown, holeCount: number): number[] => {
  if (!Array.isArray(strokes)) {
    return createStrokesArray(holeCount);
  }

  return Array.from({ length: holeCount }, (_, index) =>
    clamp(Number(strokes[index] ?? 0), 0, 20)
  );
};

const migrateLegacyScorecard = (persisted: LegacyScorecard): Scorecard => {
  const holes = normaliseHoles(persisted.holes);
  const strokes = holes.map((hole, index) =>
    clamp(Number(persisted.holes?.[index]?.strokes ?? 0), 0, 20)
  );

  return {
    courseName: persisted.courseName ?? '',
    holes,
    players: [
      {
        id: createId(),
        name: persisted.playerName ?? 'Player 1',
        strokes
      }
    ]
  };
};

const normalisePlayers = (
  players: PersistedPlayer[] | undefined,
  holeCount: number
): PlayerScore[] => {
  if (!Array.isArray(players) || players.length === 0) {
    return [createDefaultPlayer(1, holeCount)];
  }

  return players.slice(0, MAX_PLAYERS).map((player, index) => ({
    id: typeof player?.id === 'string' && player.id.length > 0 ? player.id : createId(),
    name: player?.name ?? `Player ${index + 1}`,
    strokes: normaliseStrokes(player?.strokes, holeCount)
  }));
};

const loadScorecard = (): Scorecard => {
  if (typeof localStorage === 'undefined') {
    return createDefaultScorecard();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createDefaultScorecard();
  }

  try {
    const parsed = JSON.parse(stored) as PersistedScorecard;

    if (!Array.isArray(parsed.players)) {
      return migrateLegacyScorecard(parsed);
    }

    const holes = normaliseHoles(parsed.holes);
    const players = normalisePlayers(parsed.players, holes.length);

    return {
      courseName: parsed.courseName ?? '',
      holes,
      players
    };
  } catch (error) {
    console.warn('Failed to parse stored scorecard, resetting.', error);
    return createDefaultScorecard();
  }
};

const ensurePlayerStrokes = (player: PlayerScore, holeCount: number): PlayerScore => {
  if (player.strokes.length === holeCount) {
    return player;
  }

  const strokes = Array.from({ length: holeCount }, (_, index) =>
    clamp(Number(player.strokes[index] ?? 0), 0, 20)
  );

  return { ...player, strokes };
};

const initialState = loadScorecard();

export const scorecard = writable<Scorecard>({
  ...initialState,
  players: initialState.players.map((player) =>
    ensurePlayerStrokes(player, initialState.holes.length)
  )
});

scorecard.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
});

export const setCourseName = (courseName: string) => {
  scorecard.update((current) => ({ ...current, courseName }));
};

export const setPlayerName = (playerId: string, name: string) => {
  scorecard.update((current) => ({
    ...current,
    players: current.players.map((player) =>
      player.id === playerId ? { ...player, name } : player
    )
  }));
};

export const updateHolePar = (index: number, par: number) => {
  scorecard.update((current) => {
    if (!current.holes[index]) {
      return current;
    }

    const nextPar = Number.isFinite(par) ? clamp(par, 1, 8) : current.holes[index].par;
    const holes = current.holes.map((hole, holeIndex) =>
      holeIndex === index ? { ...hole, par: nextPar } : hole
    );

    return { ...current, holes };
  });
};

export const updatePlayerStrokes = (playerId: string, holeIndex: number, strokes: number) => {
  scorecard.update((current) => ({
    ...current,
    players: current.players.map((player) => {
      if (player.id !== playerId || !current.holes[holeIndex]) {
        return player;
      }

      const nextStrokes = Number.isFinite(strokes) ? clamp(strokes, 0, 20) : player.strokes[holeIndex] ?? 0;
      const updatedStrokes = player.strokes.map((value, index) =>
        index === holeIndex ? nextStrokes : value
      );

      return { ...player, strokes: updatedStrokes };
    })
  }));
};

export const addHole = () => {
  scorecard.update((current) => {
    if (current.holes.length >= MAX_HOLES) {
      return current;
    }

    const nextNumber = current.holes.length + 1;
    const holes = [...current.holes, { number: nextNumber, par: 4 }];
    const players = current.players.map((player) => ({
      ...player,
      strokes: [...player.strokes, 0]
    }));

    return { ...current, holes, players };
  });
};

export const removeHole = () => {
  scorecard.update((current) => {
    if (current.holes.length <= 1) {
      return current;
    }

    const holes = current.holes.slice(0, -1);
    const players = current.players.map((player) => ({
      ...player,
      strokes: player.strokes.slice(0, -1)
    }));

    return { ...current, holes, players };
  });
};

export const addPlayer = (name?: string) => {
  scorecard.update((current) => {
    if (current.players.length >= MAX_PLAYERS) {
      return current;
    }

    const newPlayerIndex = current.players.length + 1;
    const playerName = name ?? `Player ${newPlayerIndex}`;

    const newPlayer: PlayerScore = {
      id: createId(),
      name: playerName,
      strokes: createStrokesArray(current.holes.length)
    };

    return { ...current, players: [...current.players, newPlayer] };
  });
};

export const removePlayer = (playerId: string) => {
  scorecard.update((current) => {
    if (current.players.length <= 1) {
      return current;
    }

    const players = current.players.filter((player) => player.id !== playerId);
    if (players.length === current.players.length) {
      return current;
    }

    return { ...current, players };
  });
};

export const resetScorecard = () => {
  scorecard.set(createDefaultScorecard());
};
