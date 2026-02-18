import { hashContent, normalizeContent } from '../lib/monitor/evidence-store'

describe('Evidence Store — Hash SHA-256 e normalização', () => {
  describe('normalizeContent', () => {
    it('deve converter para minúsculas', () => {
      const result = normalizeContent('TEXTO EM MAIÚSCULAS')
      expect(result).toBe('texto em maiúsculas')
    })

    it('deve remover espaços extras (collapse whitespace)', () => {
      const result = normalizeContent('texto    com    espaços')
      expect(result).toBe('texto com espaços')
    })

    it('deve remover espaços no início e fim (trim)', () => {
      const result = normalizeContent('   texto com espaços   ')
      expect(result).toBe('texto com espaços')
    })

    it('deve normalizar quebras de linha como espaço', () => {
      const result = normalizeContent('linha1\nlinha2\n\nlinha3')
      expect(result).toBe('linha1 linha2 linha3')
    })

    it('deve normalizar tabs como espaço', () => {
      const result = normalizeContent('col1\tcol2\tcol3')
      expect(result).toBe('col1 col2 col3')
    })

    it('deve retornar string vazia para input vazio', () => {
      expect(normalizeContent('')).toBe('')
      expect(normalizeContent('   ')).toBe('')
    })
  })

  describe('hashContent', () => {
    it('deve retornar string hexadecimal de 64 caracteres (SHA-256)', () => {
      const hash = hashContent('conteúdo de teste')
      expect(hash).toHaveLength(64)
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
    })

    it('deve retornar hash idempotente para o mesmo conteúdo', () => {
      const hash1 = hashContent('mesmo conteúdo')
      const hash2 = hashContent('mesmo conteúdo')
      expect(hash1).toBe(hash2)
    })

    it('deve retornar hashes diferentes para conteúdos diferentes', () => {
      const hash1 = hashContent('conteúdo A')
      const hash2 = hashContent('conteúdo B')
      expect(hash1).not.toBe(hash2)
    })

    it('deve normalizar antes de calcular o hash', () => {
      // Same content, different whitespace → same hash
      const hash1 = hashContent('texto  com  espaços')
      const hash2 = hashContent('texto com espaços')
      expect(hash1).toBe(hash2)
    })

    it('deve normalizar case antes de calcular o hash', () => {
      const hash1 = hashContent('TEXTO MAIÚSCULO')
      const hash2 = hashContent('texto maiúsculo')
      expect(hash1).toBe(hash2)
    })

    it('deve tratar conteúdo vazio', () => {
      const hash = hashContent('')
      expect(hash).toHaveLength(64)
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true)
    })

    it('deve detectar mudança real de conteúdo', () => {
      const original = 'Lei 12345/2024 — alíquota ICMS: 12%'
      const modified = 'Lei 12345/2024 — alíquota ICMS: 7%'
      const hash1 = hashContent(original)
      const hash2 = hashContent(modified)
      expect(hash1).not.toBe(hash2)
    })

    it('deve ser insensível a mudanças de formatação irrelevantes', () => {
      const v1 = '  Lei   12345/2024  ICMS   12%  '
      const v2 = 'lei 12345/2024 icms 12%'
      // After normalization both should be identical → same hash
      const hash1 = hashContent(v1)
      const hash2 = hashContent(v2)
      expect(hash1).toBe(hash2)
    })
  })
})
