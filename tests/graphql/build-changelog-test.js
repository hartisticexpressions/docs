import yaml from 'js-yaml'
import { createChangelogEntry, cleanPreviewTitle, previewAnchor, prependDatedEntry } from '../../script/graphql/build-changelog.js'
import xFs from 'fs'
import MockDate from 'mockdate'
import readFileAsync from '../../lib/readfile-async.js'
import readJsonFile from '../../lib/read-json-file.js'
const fs = xFs.promises
const expectedChangelogEntry = readJsonFile('./tests/fixtures/changelog-entry.json')
const expectedUpdatedChangelogFile = readJsonFile('./tests/fixtures/updated-changelog-file.json')

describe('creating a changelog from old schema and new schema', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('finds a diff of schema changes, upcoming changes, and preview changes', async () => {
    const oldSchemaString = `
    type PreviewType {
      field1(changeTypeArgument: Int): Int
    }

    type Query {
      stableField: String
      removedField: Boolean
      argumentsField(
        removedRequiredArgument: Int!
        removedOptionalArgument: Int!
        argumentMadeRequired: Int
        argumentMadeOptional: Int!
      ): String
      previewField: PreviewType
    }
    `

    const newSchemaString = `
    type PreviewType {
      field1(changeTypeArgument: Float): Int
    }

    type Query {
      stableField: String
      argumentsField(
        argumentMadeRequired: Int!
        argumentMadeOptional: Int
      ): String
      previewField: PreviewType!
    }
    `

    const previews = yaml.load(`
- title: Test preview
  description: This preview is just for test
  toggled_by: ':test_preview'
  announcement: null
  updates: null
  toggled_on:
    - PreviewType
    - Query.previewField
  owning_teams:
    - '@github/engineering'
`)

    const oldUpcomingChanges = yaml.load(`
upcoming_changes:
  - location: EnterprisePendingCollaboratorEdge.isUnlicensed
    description: '\`isUnlicensed\` will be removed.'
    date: '2021-01-01T00:00:00+00:00'
`).upcoming_changes

    const newUpcomingChanges = yaml.load(`
upcoming_changes:
  - location: Query.stableField
    description: '\`stableField\` will be removed.'
    date: '2021-06-01T00:00:00+00:00'
  - location: EnterprisePendingCollaboratorEdge.isUnlicensed
    description: '\`isUnlicensed\` will be removed.'
    date: '2021-01-01T00:00:00+00:00'
`).upcoming_changes

    const entry = await createChangelogEntry(oldSchemaString, newSchemaString, previews, oldUpcomingChanges, newUpcomingChanges)
    expect(entry).toEqual(expectedChangelogEntry)
  })

  it('returns null when there isnt any difference', async () => {
    const schemaString = `
    type Query {
      i: Int!
    }`

    const nullEntry = await createChangelogEntry(schemaString, schemaString, [], [], [])
    expect(nullEntry).toBeNull()
  })
})

describe('Preparing preview links', () => {
  it('fixes preview names', () => {
    // These two are special cases
    expect(cleanPreviewTitle('UpdateRefsPreview')).toEqual('Update refs preview')
    expect(cleanPreviewTitle('MergeInfoPreview')).toEqual('Merge info preview')
    // Previews that don't end in " preview" have it added
    expect(cleanPreviewTitle('something interesting')).toEqual('something interesting preview')
    // Other things are left as-is
    expect(cleanPreviewTitle('nice preview')).toEqual('nice preview')
  })

  it('creates anchors from preview titles', () => {
    expect(previewAnchor('Merge info preview')).toEqual('merge-info-preview')
    expect(previewAnchor('some.punct123 preview')).toEqual('somepunct123-preview')
  })
})

describe('updating the changelog file', () => {
  afterEach(() => {
    MockDate.reset()
  })

  it('modifies the entry object and the file on disk', async () => {
    const testTargetPath = 'tests/graphql/example_changelog.json'
    const previousContents = await readFileAsync(testTargetPath)

    const exampleEntry = { someStuff: true }
    const expectedDate = '2020-11-20'
    MockDate.set(expectedDate)

    prependDatedEntry(exampleEntry, testTargetPath)
    const newContents = await readFileAsync(testTargetPath, 'utf8')
    // reset the file:
    await fs.writeFile(testTargetPath, previousContents)

    expect(exampleEntry).toEqual({ someStuff: true, date: expectedDate })
    expect(JSON.parse(newContents)).toEqual(expectedUpdatedChangelogFile)
  })
})
