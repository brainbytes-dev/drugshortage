import { POST } from '@/app/api/newsletter/subscribe/route'

describe('Newsletter Subscribe API', () => {
  const mockEnv = process.env

  beforeEach(() => {
    process.env = { ...mockEnv }
    global.fetch = jest.fn()
  })

  afterEach(() => {
    process.env = mockEnv
    jest.restoreAllMocks()
  })

  describe('Input Validation', () => {
    it('should reject missing email', async () => {
      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Invalid email')
    })

    it('should reject email without @', async () => {
      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'notanemail' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('should reject non-string email', async () => {
      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 123 }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('should accept valid email', async () => {
      process.env.ENCHARGE_WRITE_KEY = 'test-key'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
    })
  })

  describe('Configuration Validation', () => {
    it('should return 500 when ENCHARGE_WRITE_KEY is missing', async () => {
      delete process.env.ENCHARGE_WRITE_KEY

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(500)
      const data = await res.json()
      expect(data.error).toBe('Server misconfiguration')
    })

    it('should return 500 when ENCHARGE_WRITE_KEY is empty', async () => {
      process.env.ENCHARGE_WRITE_KEY = ''

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(500)
    })
  })

  describe('Encharge API Integration', () => {
    beforeEach(() => {
      process.env.ENCHARGE_WRITE_KEY = 'test-key-123'
    })

    it('should send correct payload to Encharge', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      })

      await POST(req)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://ingest.encharge.io/v1',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Encharge-Token': 'test-key-123',
          },
          body: JSON.stringify({
            name: 'Subscribed to newsletter',
            user: { email: 'user@example.com' },
            properties: {
              tags: 'engpass-signal',
              source: 'engpassradar.ch',
            },
          }),
        })
      )
    })

    it('should handle Encharge API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(502)
      const data = await res.json()
      expect(data.error).toBe('Subscription failed')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      await expect(POST(req)).rejects.toThrow()
    })

    it('should handle 500 errors from Encharge', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(502)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.ENCHARGE_WRITE_KEY = 'test-key'
    })

    it('should handle emails with special characters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'user+tag@example.co.uk' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('should handle very long emails', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com'
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: longEmail }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
    })

    it('should handle malformed JSON', async () => {
      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: 'not json',
      })

      await expect(POST(req)).rejects.toThrow()
    })

    it('should log errors without exposing details', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'API Key Invalid',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      await POST(req)
      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })
  })

  describe('Security', () => {
    beforeEach(() => {
      process.env.ENCHARGE_WRITE_KEY = 'test-key'
    })

    it('should not expose ENCHARGE_WRITE_KEY in errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const res = await POST(req)
      const data = await res.json()
      const body = JSON.stringify(data)

      expect(body).not.toContain('test-key')
      expect(body).not.toContain('ENCHARGE_WRITE_KEY')
    })

    it('should sanitize email input for injection attempts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: async () => '{}',
      })

      const req = new Request('http://localhost/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email: '<script>alert(1)</script>@example.com' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(400) // Should reject invalid format
    })
  })
})
