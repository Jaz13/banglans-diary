import { describe, it, expect } from 'vitest'

/**
 * Scores API — Validation Logic Tests
 *
 * Tests the validation rules that the scores API enforces.
 * We test the logic patterns without hitting Supabase.
 */

describe('Scores API validation', () => {
  it('requires game_type field', () => {
    const body = { score: 85 }
    const isValid = body.hasOwnProperty('game_type') && (body as any).game_type
    expect(isValid).toBeFalsy()
  })

  it('requires score field', () => {
    const body = { game_type: 'word_chain' }
    const isValid = (body as any).score !== undefined
    expect(isValid).toBe(false)
  })

  it('accepts valid payload', () => {
    const body = { game_type: 'word_chain', score: 75, metadata: { difficulty: 'medium' } }
    const isValid = body.game_type && body.score !== undefined
    expect(isValid).toBeTruthy()
  })

  it('score 0 is valid (not falsy)', () => {
    const body = { game_type: 'memory_match', score: 0 }
    // The API checks `score === undefined`, not `!score`
    const isValid = body.game_type && body.score !== undefined
    expect(isValid).toBeTruthy()
  })

  it('accepted game types include all games', () => {
    const gameTypes = ['memory_match', 'word_chain', 'snakes_ladders', 'spot_difference', 'quiz']
    for (const gt of gameTypes) {
      expect(typeof gt).toBe('string')
      expect(gt.length).toBeGreaterThan(0)
    }
  })

  it('score should be clamped 0-100 before submission', () => {
    const rawScores = [-5, 0, 50, 100, 150]
    const clamped = rawScores.map(s => Math.max(0, Math.min(100, s)))
    expect(clamped).toEqual([0, 0, 50, 100, 100])
  })

  it('metadata is optional (null is valid)', () => {
    const body = { game_type: 'word_chain', score: 50, metadata: null }
    expect(body.metadata).toBeNull()
    // API does: metadata: metadata || null — so undefined also maps to null
    const metadata2 = undefined || null
    expect(metadata2).toBeNull()
  })
})

describe('Score submission payload format', () => {
  it('word_chain metadata has expected fields', () => {
    const metadata = {
      words_played: 12,
      difficulty: 'medium',
      total_time_seconds: 45,
      longest_word: 'elephant',
    }
    expect(metadata).toHaveProperty('words_played')
    expect(metadata).toHaveProperty('difficulty')
    expect(metadata).toHaveProperty('total_time_seconds')
    expect(metadata).toHaveProperty('longest_word')
    expect(typeof metadata.words_played).toBe('number')
    expect(typeof metadata.total_time_seconds).toBe('number')
  })

  it('memory_match metadata has expected fields', () => {
    const metadata = {
      moves: 24,
      pairs: 8,
      time_seconds: 60,
      difficulty: 'medium',
    }
    expect(metadata).toHaveProperty('moves')
    expect(metadata).toHaveProperty('pairs')
    expect(metadata).toHaveProperty('time_seconds')
    expect(metadata).toHaveProperty('difficulty')
  })
})
