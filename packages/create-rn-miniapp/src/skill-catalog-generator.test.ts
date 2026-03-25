import assert from 'node:assert/strict'
import test from 'node:test'
import { renderSkillCatalogSource } from './skills/catalog-generator.js'

test('renderSkillCatalogSource escapes labels with JSON-safe string serialization', () => {
  const source = renderSkillCatalogSource([
    {
      id: 'test-skill',
      description: "설명 첫 줄\n둘째 줄 'quoted'",
      agentsLabel: "한 줄\n둘째 줄 'quoted'",
      category: 'core',
      order: 1,
    },
  ])

  assert.match(source, /'test-skill': \{/)
  assert.match(source, /agentsLabel: '한 줄\\n둘째 줄 \\'quoted\\''/)
  assert.match(source, /description:\n\s+'설명 첫 줄\\n둘째 줄 \\'quoted\\'',/)
  assert.doesNotMatch(source, /"test-skill"/)
})
