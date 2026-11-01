import { useEffect, useRef } from 'react'
import { UK_MAP, councilAreas } from '../data/uk-councils'

/**
 * ONS local authority districts, May 2025 (ultra-generalised), simplified for display.
 * Each area lights in turn as a stand-in for a planning application arriving.
 * The sequence is illustrative. It is not a live count.
 */
export function UkCouncilMap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const paths = svgRef.current?.querySelectorAll<SVGPathElement>('path[data-i]')
    if (!paths || paths.length === 0 || reduce) return
    let index = 0
    const paint = () => {
      const previous = (index - 1 + paths.length) % paths.length
      const older = (index - 2 + paths.length) % paths.length
      paths[older]?.classList.remove('is-on', 'is-recent')
      paths[previous]?.classList.remove('is-on')
      paths[previous]?.classList.add('is-recent')
      paths[index]?.classList.add('is-on')
      paths[index]?.classList.remove('is-recent')
      const area = councilAreas[index]
      const chip = chipRef.current
      const name = nameRef.current
      if (area && chip && name) {
        const x = Math.min(72, Math.max(28, (area.cx / UK_MAP.width) * 100))
        const y = Math.min(84, Math.max(12, (area.cy / UK_MAP.height) * 100))
        chip.style.left = `${x}%`
        chip.style.top = `${y}%`
        name.textContent = area.name
      }
      index = (index + 1) % paths.length
    }
    paint()
    const timer = window.setInterval(paint, 640)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <figure className="mx-auto w-full max-w-[560px]">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${UK_MAP.width} ${UK_MAP.height}`}
          className="mx-auto h-[min(64vh,640px)] w-auto max-w-full"
          role="img"
          aria-label="Map of United Kingdom local authority districts. Areas light one by one, as a stand-in for planning applications arriving from each council."
        >
          <filter id="uk-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {councilAreas.map((area, index) => (
            <path key={area.code} data-i={index} d={area.d} className="uk-area" fillRule="evenodd">
              <title>{area.name}</title>
            </path>
          ))}
        </svg>
        <div ref={chipRef} className="uk-chip" aria-hidden="true">
          <span ref={nameRef} className="block font-semibold text-[#172554]">United Kingdom</span>
          <span className="mt-0.5 block text-[11px] font-medium text-[#52627A]">New application</span>
        </div>
      </div>
      <figcaption className="mx-auto mt-3 max-w-md text-center text-[11px] leading-5 text-[#64748B]">
        Each council lights as an application arrives. Illustrative sequence, not a live feed.
        Local authority districts, May 2025, Office for National Statistics. Contains OS data © Crown copyright and database right 2025.
        Contains National Statistics data © Crown copyright and database right 2025. Open Government Licence v3.0.
      </figcaption>
    </figure>
  )
}
