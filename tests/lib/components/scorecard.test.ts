import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  scorecard,
  setCourseName,
  setPlayerName,
  updateHolePar,
  updatePlayerStrokes,
  addHole,
  removeHole,
  addPlayer,
  removePlayer,
  resetScorecard,
  createScorecardCsv
} from '$lib/scorecard';
import type { Scorecard } from '$lib/types';

const holeCount = 9;

const createBaseline = (): Scorecard => ({
  courseName: '',
  holes: Array.from({ length: holeCount }, (_, index) => ({
    number: index + 1,
    par: 4
  })),
  players: [
    {
      id: 'player-1',
      name: 'Player 1',
      strokes: Array.from({ length: holeCount }, () => 0)
    }
  ]
});

describe('scorecard store', () => {
  beforeEach(() => {
    scorecard.set(createBaseline());
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('updates course and player metadata', () => {
    setCourseName('Pebble Beach');
    setPlayerName('player-1', 'Jordan Spieth');

    const current = get(scorecard);
    expect(current.courseName).toBe('Pebble Beach');
    expect(current.players[0].name).toBe('Jordan Spieth');
  });

  it('clamps par and stroke inputs to sensible ranges', () => {
    updateHolePar(0, 12);
    updatePlayerStrokes('player-1', 0, 25);
    updateHolePar(1, 0);
    updatePlayerStrokes('player-1', 1, -5);
    updateHolePar(2, 3.6);

    const current = get(scorecard);
    expect(current.holes[0].par).toBe(8);
    expect(current.players[0].strokes[0]).toBe(20);
    expect(current.holes[1].par).toBe(1);
    expect(current.players[0].strokes[1]).toBe(0);
    expect(current.holes[2].par).toBe(4);
  });

  it('adds and removes holes while preserving numbering and player strokes', () => {
    addHole();
    addHole();
    removeHole();

    const current = get(scorecard);
    expect(current.holes).toHaveLength(10);
    expect(current.holes[9].number).toBe(10);
    expect(current.players[0].strokes).toHaveLength(10);
    expect(current.players[0].strokes[9]).toBe(0);
  });

  it('adds and removes players with aligned stroke counts', () => {
    addPlayer('Player 2');
    addPlayer('Player 3');

    let current = get(scorecard);
    expect(current.players).toHaveLength(3);
    expect(current.players[1].strokes).toHaveLength(holeCount);
    expect(current.players[2].strokes).toHaveLength(holeCount);

    removePlayer(current.players[1].id);
    current = get(scorecard);
    expect(current.players).toHaveLength(2);
  });

  it('resets the scorecard back to its baseline state', () => {
    setCourseName('Local Course');
    setPlayerName('player-1', 'Test Player');
    updatePlayerStrokes('player-1', 0, 7);
    addHole();
    addPlayer('Player 2');

    resetScorecard();

    const current = get(scorecard);
    expect(current.courseName).toBe('');
    expect(current.players).toHaveLength(1);
    expect(current.holes).toHaveLength(holeCount);
    expect(current.players[0].strokes).toHaveLength(holeCount);
    current.holes.forEach((hole, index) => {
      expect(hole.number).toBe(index + 1);
      expect(hole.par).toBe(4);
      expect(current.players[0].strokes[index]).toBe(0);
    });
  });

  it('creates CSV output with course details and relative scores', () => {
    const csv = createScorecardCsv({
      courseName: 'Pebble Beach',
      holes: [
        { number: 1, par: 4 },
        { number: 2, par: 3 }
      ],
      players: [
        { id: 'p1', name: 'Jordan Spieth', strokes: [4, 3] },
        { id: 'p2', name: '', strokes: [5, 4] }
      ]
    });

    expect(csv).toContain('Course Name,Pebble Beach');
    expect(csv).toContain('Player,Hole 1,Hole 2,Total,Relative');
    expect(csv).toContain('Par,4,3,7,E');
    expect(csv).toContain('Jordan Spieth,4,3,7,E');
    expect(csv).toContain('Player 2,5,4,9,+2');
  });

  it('escapes commas and quotes when generating CSV', () => {
    const csv = createScorecardCsv({
      courseName: 'Links, "Course"',
      holes: [{ number: 1, par: 4 }],
      players: [{ id: 'p1', name: 'Ann, "Ace"', strokes: [4] }]
    });

    const lines = csv.split('\n');
    expect(lines[0]).toBe('Course Name,"Links, ""Course"""');
    expect(lines[5]).toBe('"Ann, ""Ace""",4,4,E');
  });
});
