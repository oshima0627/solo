import Link from 'next/link'

const HANDS = [
  { group: 'ソロ', name: 'バクダン', cards: '黒の10 - 黒の10', note: '最強。黒の10は2枚しかないので必ず単独' },
  { group: 'ソロ', name: '10ソロ', cards: '10 - 10（赤が絡む）', note: '40枚構成のときだけ存在する' },
  { group: 'ソロ', name: '9ソロ 〜 2ソロ', cards: '同じ数字2枚', note: '数字が大きいほど強い' },
  { group: 'ソロ', name: 'ピンゾロ', cards: 'A - A', note: 'ソロの中では最弱（設定で変更可）' },
  { group: '逆ソロ', name: '逆ソロ', cards: '9 - 6', note: 'ソロの下、ピンの上' },
  { group: 'ピン', name: 'テンピン', cards: 'A - 10', note: '合計は1だが強い' },
  { group: 'ピン', name: 'クッピン', cards: 'A - 9', note: '合計は0（ブタ）だが強い' },
  { group: 'ピン', name: 'ゴピン', cards: 'A - 5', note: '合計は6だが強い' },
  { group: '数字', name: 'カブ', cards: '合計の一の位が9', note: '数字役の最強' },
  { group: '数字', name: '8 〜 1', cards: '合計の一の位', note: '' },
  { group: '数字', name: 'ブタ', cards: '合計の一の位が0', note: '数字役の最弱' },
  { group: '特殊', name: 'シロクの流れ', cards: '4 - 6', note: 'その局を流す。役比較より先に判定' },
]

export default function RulesPage() {
  return (
    <main className="flex min-h-dvh flex-col gap-6 p-4 pb-10">
      <header className="flex items-center gap-3">
        <Link href="/" className="rounded-lg px-2 py-1 text-sm text-foam-300">
          ← 戻る
        </Link>
        <h1 className="text-xl font-bold">ルール</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">ソロとは</h2>
        <p className="text-sm leading-relaxed text-foam-300">
          沖縄で遊ばれてきたローカルなトランプゲームです。1970〜80年代の県内の学校で広く遊ばれていましたが、
          公式ルールが存在せず、記録もほとんど残っていません。おいちょかぶ系（カブ系）に分類され、
          韓国の「ソッタ」、兵庫の「かちかち」と構造をほぼ共有します。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">遊び方</h2>
        <ol className="space-y-2 text-sm leading-relaxed text-foam-300">
          <li>1. トランプのA〜10だけを使います（J・Q・K・JOKERは使いません）。</li>
          <li>2. 全員が場代を出し、各自に2枚ずつ配ります。</li>
          <li>3. 手札を見て、勝負するか降りるかを決めます。</li>
          <li>4. 公開して役の強さを比べ、最も強い人が場のチップを総取りします。</li>
        </ol>
        <p className="rounded-xl bg-sea-900 p-3 text-center text-sm font-bold">
          ソロ ＞ 逆ソロ ＞ ピン ＞ 数字
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">役の一覧（強い順）</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-sea-700 text-left text-xs text-foam-500">
                <th className="py-2 pr-2 font-normal">役</th>
                <th className="py-2 pr-2 font-normal">手札</th>
                <th className="py-2 font-normal">備考</th>
              </tr>
            </thead>
            <tbody>
              {HANDS.map((hand) => (
                <tr key={hand.name} className="border-b border-sea-800 align-top">
                  <td className="py-2 pr-2 font-bold whitespace-nowrap">{hand.name}</td>
                  <td className="py-2 pr-2 whitespace-nowrap text-foam-300">{hand.cards}</td>
                  <td className="py-2 text-xs text-foam-500">{hand.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">ピン役は「弱い手の救済」</h2>
        <p className="text-sm leading-relaxed text-foam-300">
          ソロで最も間違えやすいのがピン役です。A-9は合計すると0（ブタ）ですが、
          <strong className="text-gold-400">クッピン</strong>という強い役になります。A-10も合計は1ですが
          <strong className="text-gold-400">テンピン</strong>です。
          <br />
          <br />
          一方でA-8は合計が9（カブ）と元から強いため、救済されずピンにはなりません。
          <strong>「合計では弱くなる手だけが救済される」</strong>という構造を覚えておくと、
          降りるべきでない手で降りずに済みます。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">2つのベット方式</h2>
        <div className="space-y-3 text-sm leading-relaxed text-foam-300">
          <p>
            <strong className="text-foam-100">アンティ方式（1周）</strong>
            <br />
            端末を1周させ、各自が伏せて「勝負」か「降り」を選びます。全員の入力が揃ったら一斉公開。
            必ず1周で決着するのでテンポが速く、気軽に回せます。
          </p>
          <p>
            <strong className="text-foam-100">レイズ方式（周回）</strong>
            <br />
            ポーカーのようにレイズができ、レイズが入るたびに端末が再び周回します。
            降りても手札は公開されないため、ブラフが成立します。
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">山札は20枚か40枚か</h2>
        <div className="space-y-3 text-sm leading-relaxed text-foam-300">
          <p>
            使う枚数には説が2つあり、本アプリではゲーム設定から切り替えられます。既定は20枚です。
          </p>
          <p>
            <strong className="text-foam-100">20枚（黒のみ）</strong>
            <br />
            ♠と♣のA〜10だけを使います。「他の色およびJ・Q・K・JOKERは使いません」と明記した記録に沿った構成です。
            この場合、10のペアは必ず黒なので常にバクダンになります。
          </p>
          <p>
            <strong className="text-foam-100">40枚（赤黒）</strong>
            <br />
            ♥♦も含めた4スートを使い、
            <strong className="text-gold-400">バクダンは黒の10のペアだけ</strong>
            になります。赤が絡む10のペアはひとつ下の「10ソロ」です。
            <br />
            <br />
            この説の根拠は2つあります。ひとつは「一番強いのは
            <strong>黒の</strong>
            10のペア」という証言で、黒しか使っていないなら「黒の」と限定する意味がありません。
            もうひとつは、ソロの原型とされる株札が40枚（各ランク4枚）であることです。
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-coral-400">ローカルルールについて</h2>
        <p className="text-sm leading-relaxed text-foam-300">
          ソロは証言によってルールが分かれています。特にピンゾロ（A-A）の強さは
          「バクダンの次に強い」「ソロの中で最弱」と説が割れており、本アプリでは多数派である後者を既定にしています。
          ゲーム設定の「ローカルルール」から切り替えられます。
        </p>
      </section>

      <footer className="mt-auto border-t border-sea-800 pt-4 text-xs leading-relaxed text-foam-500">
        本アプリのチップは仮想のポイントであり、現金・換金・課金の要素は一切ありません。
      </footer>
    </main>
  )
}
