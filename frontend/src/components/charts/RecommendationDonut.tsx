type RecommendationCounts = {
  A: number
  B: number
  C: number
}

export function RecommendationDonut({
  counts,
}: {
  counts: RecommendationCounts
}) {
  const total = counts.A + counts.B + counts.C
  const adopt = total ? (counts.A / total) * 100 : 0
  const reserve = total ? ((counts.A + counts.B) / total) * 100 : 0
  const background = total
    ? `conic-gradient(var(--green) 0 ${adopt}%, var(--amber) ${adopt}% ${reserve}%, var(--red) ${reserve}% 100%)`
    : "conic-gradient(#e6ebf1 0 100%)"

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background }}>
        <span>
          {total}
          <small>total</small>
        </span>
      </div>
      <div className="legend">
        <span>
          <i className="dot dot--green" />
          Adoptar <strong>{counts.A}</strong>
        </span>
        <span>
          <i className="dot dot--amber" />
          Con reservas <strong>{counts.B}</strong>
        </span>
        <span>
          <i className="dot dot--red" />
          No adoptar <strong>{counts.C}</strong>
        </span>
      </div>
    </div>
  )
}
