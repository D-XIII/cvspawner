import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/lib/encryption'

describe('Encryption Utils', () => {
  const testApiKey = 'sk-ant-api03-test-key-1234567890'

  describe('encrypt', () => {
    it('should encrypt a string and return base64 encoded data', () => {
      const encrypted = encrypt(testApiKey)

      expect(encrypted).toBeDefined()
      expect(typeof encrypted).toBe('string')
      expect(encrypted).not.toBe(testApiKey)
      // Format: iv:authTag:encrypted (all base64 with colons as separator)
      expect(encrypted.split(':')).toHaveLength(3)
    })

    it('should produce different output for same input (random IV)', () => {
      const encrypted1 = encrypt(testApiKey)
      const encrypted2 = encrypt(testApiKey)

      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty string', () => {
      const encrypted = encrypt('')
      expect(encrypted).toBeDefined()
    })

    it('should handle special characters', () => {
      const specialKey = 'sk-test-!@#$%^&*()_+{}[]|:;<>?'
      const encrypted = encrypt(specialKey)
      expect(encrypted).toBeDefined()
    })
  })

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const encrypted = encrypt(testApiKey)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(testApiKey)
    })

    it('should handle empty string encryption/decryption', () => {
      const encrypted = encrypt('')
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe('')
    })

    it('should handle special characters encryption/decryption', () => {
      const specialKey = 'sk-test-!@#$%^&*()_+{}[]|:;<>?'
      const encrypted = encrypt(specialKey)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(specialKey)
    })

    it('should throw error for invalid encrypted data', () => {
      expect(() => decrypt('invalid-data')).toThrow()
    })

    it('should throw error for tampered data', () => {
      const encrypted = encrypt(testApiKey)
      const tampered = encrypted.slice(0, -5) + 'XXXXX'

      expect(() => decrypt(tampered)).toThrow()
    })
  })

  describe('round-trip', () => {
    it('should handle long API keys', () => {
      const longKey = 'sk-ant-' + 'a'.repeat(200)
      const encrypted = encrypt(longKey)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(longKey)
    })

    it('should handle unicode characters', () => {
      const unicodeKey = 'key-émoji-🔐-日本語'
      const encrypted = encrypt(unicodeKey)
      const decrypted = decrypt(encrypted)

      expect(decrypted).toBe(unicodeKey)
    })
  })
})
