import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import Navbar from './Navbar'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div className="min-h-[100dvh] flex flex-col bg-deep-navy">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
