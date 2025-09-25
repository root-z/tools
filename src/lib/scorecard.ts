import { writable, get } from 'svelte/store';
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

const escapeCsvValue = (value: string | number): string => {
  const stringValue = String(value ?? '');
  const escaped = stringValue.replace(/"/g, '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const buildCsvRow = (values: Array<string | number>): string =>
  values.map(escapeCsvValue).join(',');

const getPlayerLabel = (player: PlayerScore, index: number): string => {
  const trimmed = player.name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `Player ${index + 1}`;
};

const formatRelativeScore = (total: number, par: number): string => {
  const relative = total - par;
  if (relative === 0) {
    return 'E';
  }

  return relative > 0 ? `+${relative}` : String(relative);
};

const slugify = (value: string): string => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug.length > 0 ? slug : 'golf-scorecard';
};

const buildCsvFilename = (courseName: string): string => {
  const today = new Date().toISOString().slice(0, 10);
  return `${slugify(courseName)}-${today}.csv`;
};

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

export const createScorecardCsv = (data: Scorecard): string => {
  if (data.holes.length === 0) {
    return buildCsvRow(['Course Name', data.courseName ?? '']);
  }

  const holeHeaders = data.holes.map((hole) => `Hole ${hole.number}`);
  const parValues = data.holes.map((hole) => hole.par);
  const totalPar = parValues.reduce((total, par) => total + par, 0);

  const rows: string[] = [];
  rows.push(buildCsvRow(['Course Name', data.courseName ?? '']));
  rows.push(buildCsvRow(['Total Holes', data.holes.length]));
  rows.push('');
  rows.push(buildCsvRow(['Player', ...holeHeaders, 'Total', 'Relative']));
  rows.push(buildCsvRow(['Par', ...parValues, totalPar, formatRelativeScore(totalPar, totalPar)]));

  data.players.forEach((player, index) => {
    const strokes = data.holes.map((_, holeIndex) => {
      const value = player.strokes[holeIndex];
      return typeof value === 'number' && Number.isFinite(value) ? value : 0;
    });

    const playerTotal = strokes.reduce((sum, strokesForHole) => sum + strokesForHole, 0);
    rows.push(
      buildCsvRow([
        getPlayerLabel(player, index),
        ...strokes,
        playerTotal,
        formatRelativeScore(playerTotal, totalPar)
      ])
    );
  });

  return rows.join('\n');
};

export const downloadScorecardCsv = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const current = get(scorecard);
  if (!current.holes.length || !current.players.length) {
    return;
  }

  const csvContent = createScorecardCsv(current);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const urlCreator = typeof URL !== 'undefined' ? URL : undefined;
  if (!urlCreator || typeof urlCreator.createObjectURL !== 'function') {
    return;
  }

  const href = urlCreator.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = buildCsvFilename(current.courseName);
  link.style.display = 'none';

  const body = document.body;
  if (!body) {
    urlCreator.revokeObjectURL(href);
    return;
  }

  body.appendChild(link);
  link.click();
  body.removeChild(link);
  urlCreator.revokeObjectURL(href);
};
