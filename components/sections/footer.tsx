export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="dot-grid-fine h-10 border-b border-border opacity-60" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
          <span className="font-mono text-sm font-medium tracking-tight">
            m-njp<span className="text-primary">.</span>
          </span>
          <p className="nm-label-sm text-center">
            built with next.js, react and tailwind, deployed on vercel
          </p>
          <p className="nm-label-sm">&copy; 2026 niño marcos</p>
        </div>
      </div>
    </footer>
  )
}
