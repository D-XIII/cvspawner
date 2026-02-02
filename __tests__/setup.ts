import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Set environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret-for-tests!'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
