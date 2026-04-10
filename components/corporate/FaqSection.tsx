// ── Data ──────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
}

const FAQS: FaqItem[] = [
  {
    q: '障害者手帳がないと利用できませんか？',
    a: '障害者手帳がなくても、医師の診断書があれば受給者証を取得して利用できます。精神科・心療内科・発達外来などでの診断書が対象です。まずはご相談ください。',
  },
  {
    q: '本当に無料で通えますか？',
    a: 'はい、ほとんどの方が自己負担0円です。収入に応じて上限負担額が設定されますが、月9,300円が最大で、多くの方は0円になります。',
  },
  {
    q: '週何日から通えますか？',
    a: '週1日から始められます。体調や生活リズムに合わせて、無理なく通所日数を増やしていくことができます。',
  },
  {
    q: '創作経験がなくても大丈夫ですか？',
    a: 'まったく問題ありません。未経験からスタートした利用者がほとんどです。基本操作から丁寧に教えますので、安心していらしてください。',
  },
  {
    q: '見学・体験はできますか？',
    a: 'はい、随時受け付けています。実際の雰囲気を見ていただいたうえで、通所を検討していただけます。お問い合わせフォームからお気軽にご連絡ください。',
  },
  {
    q: '受給者証の申請はどこでするのですか？',
    a: 'お住まいの市区町村の福祉窓口（障害福祉課など）で申請できます。申請書類や手続きについては、スタッフがサポートしますのでご安心ください。',
  },
  {
    q: '他の就労支援事業所と掛け持ちできますか？',
    a: '受給者証に記載された支給量（日数）の範囲内であれば、複数の事業所を利用することが可能です。担当のケアマネや相談支援専門員とご相談ください。',
  },
  {
    q: '工賃はどのくらいもらえますか？',
    a: '活動内容や通所日数によって異なりますが、制作した作品が販売・採用された場合などに工賃をお支払いしています。詳しくはお問い合わせください。',
  },
  {
    q: '子どもや10代でも利用できますか？',
    a: '18歳以上の方を対象としています。18歳未満の方は、放課後等デイサービスなど別の支援機関をご案内することが可能です。',
  },
  {
    q: '通所中に体調が悪くなったらどうなりますか？',
    a: '無理をする必要はまったくありません。早退・欠席は自由です。スタッフが常駐していますので、体調の変化があればすぐに対応します。安心してお越しください。',
  },
]

// ── Sub-component ──────────────────────────────────────────────────────────────

function FaqItemEl({ item }: { item: FaqItem }) {
  return (
    <div
      data-faq-item
      className="border border-[var(--color-border)] rounded-xl overflow-hidden"
    >
      <details className="group">
        <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none text-[var(--color-text)] font-medium hover:bg-[var(--color-surface)] transition-colors duration-200">
          <span className="flex gap-3 items-start">
            <span className="text-[var(--color-primary)] font-bold flex-shrink-0">Q.</span>
            {item.q}
          </span>
          {/* CSS-only chevron: rotates when <details> is open via group-open */}
          <span className="flex-shrink-0 w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-200 group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="px-6 pb-5 pt-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <p data-faq-answer className="text-sm text-[var(--color-text-muted)] leading-relaxed">
            <span className="text-[var(--color-accent)] font-bold mr-2">A.</span>
            {item.a}
          </p>
        </div>
      </details>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FaqSection() {
  return (
    <section
      aria-label="よくある質問"
      role="region"
      id="faq"
      className="py-24 px-6 relative z-10 bg-[var(--color-bg)]/90"
    >
      <div className="max-w-3xl mx-auto mb-12 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--color-accent)] mb-3">
          FAQ
        </p>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-gradient-purple mb-4">
          よくある質問
        </h2>
        <p className="text-[var(--color-text-muted)]">
          気になることはお気軽にご質問ください。
        </p>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {FAQS.map((item) => (
          <FaqItemEl key={item.q} item={item} />
        ))}
      </div>
    </section>
  )
}
