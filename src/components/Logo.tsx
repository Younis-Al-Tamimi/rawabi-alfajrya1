export function Logo({ className = '', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 240 80" className="h-16 md:h-20 lg:h-24 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="20" y="55" fontFamily="Playfair Display, serif" fontSize="36" fontWeight="800" fill="currentColor">F9</text>
        {showText && <text x="68" y="30" fontFamily="Jost, sans-serif" fontSize="9" fontWeight="400" fill="currentColor" letterSpacing="3">FLOWERS</text>}
      </svg>
    </div>
  )
}
export function LogoMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 60 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg"><text x="6" y="42" fontFamily="Playfair Display, serif" fontSize="32" fontWeight="800" fill="currentColor">F9</text></svg>
}
