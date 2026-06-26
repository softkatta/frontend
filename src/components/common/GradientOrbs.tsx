export function GradientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="orb orb-blue w-[500px] h-[500px] -top-32 -left-32 opacity-60" />
      <div className="orb orb-green w-[400px] h-[400px] top-1/4 -right-32 opacity-50" />
      <div className="orb orb-purple w-[350px] h-[350px] bottom-0 left-1/3 opacity-40" />
    </div>
  )
}
