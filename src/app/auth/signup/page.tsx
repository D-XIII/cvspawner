'use client'

import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import { FileText } from 'lucide-react'

function SignUpContent() {
  return <AuthForm mode="signup" />
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold gradient-text">CVSpawner</span>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <SignUpContent />
      </Suspense>
    </div>
  )
}
