export type { Card, DeckColor, Rank, Suit } from './card'
export {
  RANKS,
  BLACK_SUITS,
  RED_SUITS,
  DECK_SIZE,
  HAND_SIZE,
  MIN_PLAYERS,
  MAX_PLAYERS,
  isRedSuit,
  isBlackSuit,
  suitsForColor,
  oppositeColor,
  colorOfCard,
  deckColorLabel,
  createCard,
  createDeck,
  cardId,
  suitSymbol,
  formatCard,
  isSameCard,
} from './card'

export type { Rng } from './rng'
export { mulberry32, defaultRng } from './rng'

export type { RuleVariant } from './rules'
export {
  DEFAULT_RULES,
  STANDARD_PIN_RANKS,
  ALL_PIN_RANKS,
  soloOrder,
  withRules,
} from './rules'

export type { Hand, HandCategory } from './hand'
export {
  SCORE_BASE,
  evaluateHand,
  compareHands,
  isBomb,
  isFlow,
  formatHand,
} from './hand'

export type { ShowdownEntry, ShowdownResult } from './showdown'
export { resolveShowdown, isCarryOver } from './showdown'

export type { DealtHands } from './deal'
export { shuffle, dealHands } from './deal'

export * from './game/index'

export { estimateWinRate, decideCpuAction } from './cpu'
