'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import Footer from './Footer'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function ClientLayout({ children }: Props) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-8">{children}</main>
      <Footer />
    </>
  )
}
