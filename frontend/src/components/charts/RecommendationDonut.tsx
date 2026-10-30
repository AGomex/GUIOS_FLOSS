export function RecommendationDonut() {
  return (
    <div className="donut-wrap">
      <div className="donut">
        <span>
          4<small>total</small>
        </span>
      </div>
      <div className="legend">
        <span>
          <i className="dot dot--green" />
          Adoptar <strong>1</strong>
        </span>
        <span>
          <i className="dot dot--amber" />
          Con reservas <strong>2</strong>
        </span>
        <span>
          <i className="dot dot--red" />
          No adoptar <strong>1</strong>
        </span>
      </div>
    </div>
  )
}
