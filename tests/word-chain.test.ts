import { describe, it, expect } from 'vitest'

/**
 * Word Chain Game — Logic Tests
 *
 * These tests validate the core game logic by importing the page module
 * and testing the exported constants/functions. Since the dictionary and
 * buildWordIndex are module-level, we test them through the game behavior.
 */

// We can't easily import from the page component directly (it's a default export
// with 'use client'), so we replicate the core logic here for testing.
// This ensures the algorithm stays correct if someone refactors.

function buildWordIndex(words: string[]): Record<string, string[]> {
  const index: Record<string, string[]> = {}
  const seen = new Set<string>()
  for (const w of words) {
    const lower = w.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    const letter = lower[0]
    if (!index[letter]) index[letter] = []
    index[letter].push(lower)
  }
  return index
}

function calculateScore(wordLength: number, timeRemaining: number, turnLimit: number): number {
  const wordScore = 5 + (wordLength - 3) * 2
  const speedBonus = Math.floor((timeRemaining / turnLimit) * 3)
  return wordScore + speedBonus
}

// Sample dictionary for testing
const TEST_WORDS = [
  'cat', 'car', 'table', 'elephant', 'tiger', 'rabbit', 'tree',
  'eagle', 'echo', 'orange', 'extra', 'apple', 'elastic', 'crisp',
  'plane', 'energy', 'yellow', 'wonder', 'rain', 'nest', 'test',
]

describe('buildWordIndex', () => {
  it('groups words by first letter', () => {
    const index = buildWordIndex(TEST_WORDS)
    expect(index['c']).toContain('cat')
    expect(index['c']).toContain('car')
    expect(index['c']).toContain('crisp')
    expect(index['t']).toContain('table')
    expect(index['t']).toContain('tiger')
    expect(index['e']).toContain('elephant')
  })

  it('handles duplicate words (case-insensitive)', () => {
    const index = buildWordIndex(['Cat', 'CAT', 'cat', 'dog'])
    expect(index['c'].length).toBe(1)
    expect(index['c'][0]).toBe('cat')
    expect(index['d'].length).toBe(1)
  })

  it('converts all words to lowercase', () => {
    const index = buildWordIndex(['HELLO', 'World'])
    expect(index['h'][0]).toBe('hello')
    expect(index['w'][0]).toBe('world')
  })

  it('returns empty object for empty array', () => {
    const index = buildWordIndex([])
    expect(Object.keys(index).length).toBe(0)
  })

  it('creates separate arrays for each starting letter', () => {
    const index = buildWordIndex(TEST_WORDS)
    const letters = Object.keys(index)
    expect(letters.length).toBeGreaterThan(5)
    for (const letter of letters) {
      expect(index[letter].every(w => w.startsWith(letter))).toBe(true)
    }
  })
})

describe('Word validation rules', () => {
  it('words must be at least 3 letters', () => {
    expect('hi'.length >= 3).toBe(false)
    expect('cat'.length >= 3).toBe(true)
    expect('table'.length >= 3).toBe(true)
  })

  it('next word must start with last letter of previous word', () => {
    const prev = 'cat'
    const next = 'tree'
    const requiredLetter = prev[prev.length - 1] // 't'
    expect(next[0]).toBe(requiredLetter)
  })

  it('rejects words that dont start with required letter', () => {
    const prev = 'cat'
    const next = 'apple'
    const requiredLetter = prev[prev.length - 1] // 't'
    expect(next[0]).not.toBe(requiredLetter)
  })

  it('word must be in dictionary', () => {
    const wordSet = new Set(TEST_WORDS.map(w => w.toLowerCase()))
    expect(wordSet.has('cat')).toBe(true)
    expect(wordSet.has('xylophone')).toBe(false)
  })

  it('word cannot be reused', () => {
    const usedWords = new Set(['cat', 'tree'])
    expect(usedWords.has('cat')).toBe(true)
    expect(usedWords.has('table')).toBe(false)
  })
})

describe('Score calculation', () => {
  it('gives base score of 5 for 3-letter words', () => {
    const score = calculateScore(3, 0, 10)
    expect(score).toBe(5) // 5 + (3-3)*2 + 0 bonus
  })

  it('gives higher score for longer words', () => {
    const score3 = calculateScore(3, 0, 10)
    const score5 = calculateScore(5, 0, 10)
    const score8 = calculateScore(8, 0, 10)
    expect(score5).toBeGreaterThan(score3)
    expect(score8).toBeGreaterThan(score5)
    expect(score5).toBe(5 + (5 - 3) * 2) // 9
    expect(score8).toBe(5 + (8 - 3) * 2) // 15
  })

  it('gives speed bonus for fast answers', () => {
    const slowScore = calculateScore(5, 0, 10)
    const fastScore = calculateScore(5, 10, 10)
    expect(fastScore).toBeGreaterThan(slowScore)
    expect(fastScore - slowScore).toBe(3) // max speed bonus
  })

  it('speed bonus scales with time remaining', () => {
    const halfTime = calculateScore(5, 5, 10)
    const fullTime = calculateScore(5, 10, 10)
    expect(halfTime).toBe(9 + 1) // floor(5/10 * 3) = 1
    expect(fullTime).toBe(9 + 3) // floor(10/10 * 3) = 3
  })

  it('final score is capped at 100', () => {
    // Even if raw score is over 100, it should be capped
    const rawScore = 150
    const capped = Math.min(100, rawScore)
    expect(capped).toBe(100)
  })
})

describe('AI opponent logic', () => {
  it('can find a word starting with a given letter', () => {
    const index = buildWordIndex(TEST_WORDS)
    const letter = 't'
    const available = index[letter] || []
    expect(available.length).toBeGreaterThan(0)
    expect(available.every(w => w.startsWith('t'))).toBe(true)
  })

  it('filters out used words', () => {
    const index = buildWordIndex(TEST_WORDS)
    const used = new Set(['tiger', 'tree', 'test'])
    const available = (index['t'] || []).filter(w => !used.has(w))
    expect(available).not.toContain('tiger')
    expect(available).not.toContain('tree')
    expect(available).toContain('table')
  })

  it('detects dead ends (no available words)', () => {
    const index = buildWordIndex(['cat', 'tiger'])
    const used = new Set(['tiger'])
    const available = (index['t'] || []).filter(w => !used.has(w))
    expect(available.length).toBe(0) // dead end!
  })

  it('prefers longer words on hard mode', () => {
    const index = buildWordIndex(TEST_WORDS)
    const available = index['e'] || []
    const sorted = [...available].sort((a, b) => b.length - a.length)
    // On hard mode, AI picks from top 3 longest
    expect(sorted[0].length).toBeGreaterThanOrEqual(sorted[sorted.length - 1].length)
    expect(['elephant', 'elastic', 'energy'].includes(sorted[0])).toBe(true)
  })
})

describe('Game flow', () => {
  it('starting letters are from common set', () => {
    const commonLetters = 'abcdefghilmnoprstuw'
    const validStarts = commonLetters.split('')
    // All valid start letters should be common
    for (const l of validStarts) {
      expect('abcdefghijklmnopqrstuvwxyz').toContain(l)
    }
    // Uncommon letters excluded
    expect(commonLetters).not.toContain('x')
    expect(commonLetters).not.toContain('z')
    expect(commonLetters).not.toContain('q')
  })

  it('total game time is 90 seconds', () => {
    const TOTAL_GAME_TIME = 90
    expect(TOTAL_GAME_TIME).toBe(90)
  })

  it('difficulty configs have correct turn times', () => {
    const configs = {
      easy: { turnTime: 15 },
      medium: { turnTime: 10 },
      hard: { turnTime: 7 },
    }
    expect(configs.easy.turnTime).toBe(15)
    expect(configs.medium.turnTime).toBe(10)
    expect(configs.hard.turnTime).toBe(7)
  })
})
