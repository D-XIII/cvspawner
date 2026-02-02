import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}
