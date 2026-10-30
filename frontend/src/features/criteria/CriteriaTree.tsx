import { Fragment } from "react"

import type { Dimension, Factor, Subfactor } from "@/lib/api"

type CriteriaTreeProps = {
  dimensions: Dimension[]
  factors: Factor[]
  subfactors: Subfactor[]
}

export function CriteriaTree({ dimensions, factors, subfactors }: CriteriaTreeProps) {
  return (
    <div className="tree">
      {dimensions.map((dimension) => {
        const dimensionFactors = factors.filter(
          (factor) => factor.dimension === dimension.id,
        )
        const dimensionSubfactors = dimensionFactors.reduce(
          (total, factor) => total + factor.ns,
          0,
        )

        return (
          <Fragment key={dimension.id}>
            <div className="tree-row tree-row--0">
              <div className="tree-name">
                <span>−</span>
                {dimension.name}
              </div>
              <span className="tree-meta">{dimensionFactors.length} factores</span>
              <span className="tree-metrics">{dimensionSubfactors} subfactores</span>
            </div>

            {dimensionFactors.map((factor) => {
              const factorSubfactors = subfactors.filter(
                (subfactor) => subfactor.factor === factor.id,
              )

              return (
                <Fragment key={factor.id}>
                  <div className="tree-row tree-row--1">
                    <div className="tree-name">
                      <span>−</span>
                      {factor.name}
                    </div>
                    <span className="tree-meta">{factor.scope_label}</span>
                    <span className="tree-metrics">
                      NS {factor.ns} · TC {factor.tc} · IE {factor.ie} · IL{" "}
                      {factor.il} · IS {factor.is_value}
                    </span>
                  </div>

                  {factorSubfactors.map((subfactor) => (
                    <div className="tree-row tree-row--2" key={subfactor.id}>
                      <div className="tree-name">
                        <span>·</span>
                        {subfactor.text}
                      </div>
                      <span className="tree-meta" />
                      <span className="tree-metrics">
                        {subfactor.citations} citas
                      </span>
                    </div>
                  ))}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </div>
  )
}
