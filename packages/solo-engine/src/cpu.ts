import type { Card } from './card'
import { cardId } from './card'
import { evaluateHand } from './hand'
import type { Rng } from './rng'
import { deckFor, type RuleVariant } from './rules'
import { callAmount, handCardsOf, maxRaise } from './game/selectors'
import type { GameState, PlayerAction, PlayerId } from './game/types'

/**
 * ひとり練習モード用の簡易 CPU。
 *
 * ソロは運が支配的なゲームなので、思考は「この手札がランダムな相手 1 人に勝つ確率」
 * を数え上げ、人数で累乗して閾値と比べるだけで十分に成立する。
 */

/**
 * 自分の 2 枚を除いた残りの山札から作れる相手手札すべてと比較し、勝率を求める。
 * 引き分けは 0.5、相手がシロク（流局）の場合も勝ちでも負けでもないので 0.5 とする。
 */
export function estimateWinRate(cards: readonly [Card, Card], rules: RuleVariant): number {
  const mine = evaluateHand(cards, rules)
  // 自分がシロクなら勝負を流せるので、負けることはない
  if (mine.category === 'FLOW') return 1

  const used = new Set([cardId(cards[0]), cardId(cards[1])])
  const rest = deckFor(rules).filter((card) => !used.has(cardId(card)))

  let score = 0
  let total = 0
  for (let i = 0; i < rest.length; i++) {
    for (let j = i + 1; j < rest.length; j++) {
      const other = evaluateHand([rest[i]!, rest[j]!], rules)
      total++
      if (other.category === 'FLOW') score += 0.5
      else if (mine.score > other.score) score += 1
      else if (mine.score === other.score) score += 0.5
    }
  }
  return score / total
}

/** そのラウンドでまだ降りていない、自分以外の人数 */
function liveOpponents(state: GameState, playerId: PlayerId): number {
  const round = state.round
  if (!round) return 1
  return round.order.filter((id) => id !== playerId && round.status[id] !== 'FOLDED').length
}

/**
 * CPU の行動を決める。
 * rng を渡すため、同じシードなら同じ判断を再現できる。
 */
export function decideCpuAction(state: GameState, playerId: PlayerId, rng: Rng): PlayerAction {
  const cards = handCardsOf(state, playerId)
  if (!cards) return { type: 'FOLD' }

  const rules = state.config.rules
  const hand = evaluateHand(cards, rules)
  const opponents = Math.max(1, liveOpponents(state, playerId))
  // 全員に勝つ確率。人数が増えるほど厳しくなる
  const winRate = estimateWinRate(cards, rules) ** opponents

  if (state.phase === 'DECIDE') {
    // シロクは追加の場代が要らず、勝負を流せるので常に出す
    if (hand.category === 'FLOW') return { type: 'PLAY' }
    const threshold = 0.2 + rng() * 0.14
    return winRate >= threshold ? { type: 'PLAY' } : { type: 'FOLD' }
  }

  const toCall = callAmount(state, playerId)
  const raiseCeiling = maxRaise(state, playerId)

  // シロクは流局を狙えるので降りないが、自分から吊り上げはしない
  if (hand.category === 'FLOW') return { type: 'CALL' }

  if (winRate >= 0.7 && raiseCeiling > 0) {
    const bet = Math.ceil(state.config.anteAmount * (1 + rng() * 3))
    return { type: 'RAISE', amount: Math.max(1, Math.min(raiseCeiling, bet)) }
  }

  // 追加の支払いがないなら降りる理由がない
  if (toCall === 0) return { type: 'CALL' }

  if (winRate >= 0.3) return { type: 'CALL' }

  // ごくたまにブラフを打つ
  if (raiseCeiling > 0 && rng() < 0.08) {
    return { type: 'RAISE', amount: Math.max(1, Math.min(raiseCeiling, state.config.anteAmount * 2)) }
  }

  return { type: 'FOLD' }
}
