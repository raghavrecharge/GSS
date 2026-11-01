const clone = (value) => structuredClone(value)

const requiredText = (value, field, max = 200) => {
  const text = String(value || '').trim()
  if (!text) throw new TypeError(`${field} is required`)
  if (text.length > max) throw new TypeError(`${field} exceeds ${max} characters`)
  return text
}

export function createMemoryCrmRepository(seed = {}) {
  const state = clone({ leads: [], applications: [], students: [], tasks: [], ...seed })
  return {
    async list(collection) {
      if (!Object.hasOwn(state, collection)) throw new TypeError('Unknown CRM collection')
      return clone(state[collection])
    },
    async save(collection, record) {
      if (!Object.hasOwn(state, collection)) throw new TypeError('Unknown CRM collection')
      const safeRecord = { ...clone(record), id: requiredText(record.id, 'id', 80), updatedAt: new Date().toISOString() }
      const index = state[collection].findIndex((item) => item.id === safeRecord.id)
      if (index >= 0) state[collection][index] = safeRecord
      else state[collection].push(safeRecord)
      return clone(safeRecord)
    },
  }
}

const allowedBlockTypes = new Set(['heading', 'paragraph', 'list', 'quote', 'callout', 'facts'])

export function validateContentBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length > 100) throw new TypeError('Content blocks must be an array of at most 100 items')
  return blocks.map((block, index) => {
    if (!allowedBlockTypes.has(block.type)) throw new TypeError(`Unsupported block type at position ${index + 1}`)
    return { id: requiredText(block.id, 'block id', 80), type: block.type, text: requiredText(block.text, 'block text', 10000) }
  })
}

export function createMemoryCmsRepository(seed = {}) {
  const state = clone({ pages: [], programmes: [], navigation: [], ...seed })
  return {
    async list(collection) {
      if (!Object.hasOwn(state, collection)) throw new TypeError('Unknown CMS collection')
      return clone(state[collection])
    },
    async saveDraft(collection, document) {
      if (!['pages', 'programmes'].includes(collection)) throw new TypeError('Only structured documents can be saved as drafts')
      const safeDocument = {
        ...clone(document), id: requiredText(document.id, 'id', 80), title: requiredText(document.title, 'title'),
        slug: requiredText(document.slug, 'slug', 160), status: 'draft', blocks: validateContentBlocks(document.blocks || []),
        updatedAt: new Date().toISOString(),
      }
      const index = state[collection].findIndex((item) => item.id === safeDocument.id)
      if (index >= 0) state[collection][index] = safeDocument
      else state[collection].push(safeDocument)
      return clone(safeDocument)
    },
  }
}
