import Link from 'next/link'

const HANDS: { name: string; cards: string; note: string }[] = [
  { name: 'バクダン', cards: '10 - 10', note: '最強。10は2枚しかないので必ず単独' },
  { name: '9ソロ 〜 2ソロ', cards: '同じ数字2枚', note: '数字が大きいほど強い' },
  { name: 'ピンゾロ', cards: 'A - A', note: 'ソロの中では最弱（設定で変更可）' },
  { name: '逆ソロ', cards: '9 - 6', note: 'ソロの下、ピンの上' },
  { name: 'テンピン', cards: 'A - 10', note: '合計は1だが強い' },
  { name: 'クッピン', cards: 'A - 9', note: '合計は0（ブタ）だが強い' },
  { name: 'ゴピン', cards: 'A - 5', note: '合計は6だが強い' },
  { name: 'カブ', cards: '合計の一の位が9', note: '数字役の最強' },
  { name: '8 〜 1', cards: '合計の一の位', note: '' },
  { name: 'ブタ', cards: '合計の一の位が0', note: '数字役の最弱' },
  { name: 'シロクの流れ', cards: '4 - 6', note: 'その局を流す。役比較より先に判定' },
]

function Section({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3 border-b border-rule pb-2">
        <span className="label tnum">{index}</span>
        <h2 className="text-sm font-bold tracking-[0.1em]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function RulesPage() {
  return (
    <main className="flex min-h-dvh flex-col gap-10 px-5 pb-12 pt-6">
      <header className="flex items-baseline justify-between border-b border-rule pb-3">
        <span className="label">ルール</span>
        <Link href="/" className="text-sm text-ink-soft underline underline-offset-4">
          戻る
        </Link>
      </header>

      <div>
        <h1 className="font-serif text-5xl leading-none">ソロの遊び方</h1>
        <div className="mt-5 h-px w-16 bg-vermilion" />
      </div>

      <Section index="01" title="ソロとは">
        <p className="text-sm leading-[1.95] text-ink-soft">
          沖縄で遊ばれてきたローカルなトランプゲームです。1970〜80年代の県内の学校で広く遊ばれていましたが、
          公式ルールが存在せず、記録もほとんど残っていません。おいちょかぶ系（カブ系）に分類され、
          韓国の「ソッタ」、兵庫の「かちかち」と構造をほぼ共有します。
        </p>
      </Section>

      <Section index="02" title="遊び方">
        <ol className="space-y-3 text-sm leading-relaxed text-ink-soft">
          {[
            'トランプの1色2スート（♠♣）のA〜10、計20枚だけを使います。',
            '全員が場代を出し、各自に2枚ずつ配ります。',
            '手札を見て、勝負するか降りるかを決めます。',
            '公開して役の強さを比べ、最も強い人が場のチップを総取りします。',
          ].map((text, i) => (
            <li key={i} className="flex gap-3">
              <span className="label tnum shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
        <p className="border-y border-rule py-3 text-center text-sm tracking-[0.16em]">
          ソロ　＞　逆ソロ　＞　ピン　＞　数字
        </p>
      </Section>

      <Section index="03" title="役の一覧（強い順）">
        <div className="text-sm">
          {HANDS.map((hand) => (
            <div key={hand.name} className="border-b border-rule py-3 first:border-t">
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-bold">{hand.name}</span>
                <span className="shrink-0 text-ink-soft">{hand.cards}</span>
              </div>
              {hand.note ? (
                <p className="mt-1 text-xs text-ink-faint">{hand.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>

      <Section index="04" title="ピン役は弱い手の救済">
        <p className="text-sm leading-[1.95] text-ink-soft">
          ソロで最も間違えやすいのがピン役です。A-9は合計すると0（ブタ）ですが、
          <strong className="font-bold text-ink">クッピン</strong>
          という強い役になります。A-10も合計は1ですが
          <strong className="font-bold text-ink">テンピン</strong>です。
        </p>
        <p className="text-sm leading-[1.95] text-ink-soft">
          一方でA-8は合計が9（カブ）と元から強いため、救済されずピンにはなりません。
          <strong className="font-bold text-ink">
            合計では弱くなる手だけが救済される
          </strong>
          という構造を覚えておくと、降りるべきでない手で降りずに済みます。
        </p>
      </Section>

      <Section index="05" title="2つのベット方式">
        <div className="space-y-5 text-sm leading-[1.95] text-ink-soft">
          <div>
            <p className="font-bold text-ink">アンティ方式</p>
            <p>
              端末を1周させ、各自が伏せて「勝負」か「降り」を選びます。全員の入力が揃ったら一斉公開。
              必ず1周で決着するのでテンポが速く、気軽に回せます。
            </p>
          </div>
          <div>
            <p className="font-bold text-ink">レイズ方式</p>
            <p>
              ポーカーのようにレイズができ、レイズが入るたびに端末が再び周回します。
              降りても手札は公開されないため、ブラフが成立します。
            </p>
          </div>
        </div>
      </Section>

      <Section index="06" title="バクダンで山札を入れ替える">
        <p className="text-sm leading-[1.95] text-ink-soft">
          ソロは1色20枚で遊びますが、その色は固定ではありません。
          <strong className="font-bold text-ink">
            バクダン（10のペア）が出たら、♠♣の山札と♥♦の山札を持ち替えます。
          </strong>
          次にまたバクダンが出れば、元の色に戻ります。
        </p>
        <p className="text-sm leading-[1.95] text-ink-soft">
          どちらの色でもA〜10が2枚ずつという構成は同じなので、確率にも役の強さにも一切影響しません。
          大きく場が動いた区切りを目に見える形で示す作法のようなものです。
        </p>
        <p className="text-sm leading-[1.95] text-ink-faint">
          「一番強いのは<strong>黒の</strong>
          10のペア」という証言が残っていますが、これはそのとき使っていた山札がたまたま黒だったということです。
          赤の山札で遊んでいれば、赤の10のペアがバクダンになります。
        </p>
      </Section>

      <Section index="07" title="ローカルルールについて">
        <p className="text-sm leading-[1.95] text-ink-soft">
          ソロは証言によってルールが分かれています。特にピンゾロ（A-A）の強さは
          「バクダンの次に強い」「ソロの中で最弱」と説が割れており、本アプリでは多数派である後者を既定にしています。
          ゲーム設定の「ローカルルール」から切り替えられます。
        </p>
      </Section>

      <footer className="mt-auto border-t border-rule pt-4 text-xs leading-relaxed text-ink-faint">
        本アプリのチップは仮想のポイントであり、現金・換金・課金の要素は一切ありません。
      </footer>
    </main>
  )
}
