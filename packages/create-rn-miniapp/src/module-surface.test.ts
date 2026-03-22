import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

const SRC_ROOT = fileURLToPath(new URL('../src/', import.meta.url))
const FORBIDDEN_RUNTIME_MODULES = ['templates/runtime.ts', 'patching/runtime.ts'] as const
const FORBIDDEN_INTERNAL_BARRELS = new Set(['templates/index.ts', 'patching/index.ts'])

async function listSourceFiles(currentDir: string): Promise<string[]> {
  const { readdir } = await import('node:fs/promises')
  const entries = await readdir(currentDir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const nextPath = path.join(currentDir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(nextPath)))
      continue
    }

    if (entry.name.endsWith('.ts') || entry.name.endsWith('.mts')) {
      files.push(nextPath)
    }
  }

  return files
}

function collectRelativeImportBindings(sourceFile: ts.SourceFile) {
  const importedBindings = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.')
    ) {
      continue
    }

    const importClause = statement.importClause

    if (!importClause) {
      continue
    }

    if (importClause.name) {
      importedBindings.add(importClause.name.text)
    }

    const namedBindings = importClause.namedBindings

    if (!namedBindings) {
      continue
    }

    if (ts.isNamespaceImport(namedBindings)) {
      importedBindings.add(namedBindings.name.text)
      continue
    }

    for (const element of namedBindings.elements) {
      importedBindings.add(element.name.text)
    }
  }

  return importedBindings
}

function collectRelativeModuleSpecifiers(sourceFile: ts.SourceFile) {
  const moduleSpecifiers: string[] = []

  for (const statement of sourceFile.statements) {
    if (
      (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      moduleSpecifiers.push(statement.moduleSpecifier.text)
    }
  }

  return moduleSpecifiers
}

function collectForwardedRelativeBindings(sourceFile: ts.SourceFile) {
  const importedBindings = collectRelativeImportBindings(sourceFile)
  const forwardedBindings: string[] = []

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
        continue
      }

      for (const element of statement.exportClause.elements) {
        const localName = element.propertyName?.text ?? element.name.text

        if (importedBindings.has(localName)) {
          forwardedBindings.push(element.name.text)
        }
      }

      continue
    }

    if (!isExported(statement)) {
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          ts.isIdentifier(declaration.initializer) &&
          importedBindings.has(declaration.initializer.text)
        ) {
          forwardedBindings.push(declaration.name.text)
        }
      }

      continue
    }

    if (
      ts.isTypeAliasDeclaration(statement) &&
      ts.isTypeReferenceNode(statement.type) &&
      ts.isIdentifier(statement.type.typeName) &&
      importedBindings.has(statement.type.typeName.text)
    ) {
      forwardedBindings.push(statement.name.text)
    }
  }

  return forwardedBindings
}

function isExported(statement: ts.Statement) {
  return (
    ts.canHaveModifiers(statement) &&
    ts.getModifiers(statement)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  )
}

function isPureForwardingModule(source: string) {
  const sourceFile = ts.createSourceFile('module.ts', source, ts.ScriptTarget.Latest, true)
  const importedBindings = collectRelativeImportBindings(sourceFile)
  let sawRelativeImport = importedBindings.size > 0
  let sawForwardingExport = false
  let sawLocalImplementation = false

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text.startsWith('.')
      ) {
        sawRelativeImport = true
      }

      continue
    }

    if (ts.isExportDeclaration(statement)) {
      sawForwardingExport = true
      continue
    }

    if (!isExported(statement)) {
      sawLocalImplementation = true
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          declaration.initializer &&
          ts.isIdentifier(declaration.initializer) &&
          importedBindings.has(declaration.initializer.text)
        ) {
          sawForwardingExport = true
          continue
        }

        sawLocalImplementation = true
      }

      continue
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      if (
        ts.isTypeReferenceNode(statement.type) &&
        ts.isIdentifier(statement.type.typeName) &&
        importedBindings.has(statement.type.typeName.text)
      ) {
        sawForwardingExport = true
        continue
      }

      sawLocalImplementation = true
      continue
    }

    sawLocalImplementation = true
  }

  return sawRelativeImport && sawForwardingExport && !sawLocalImplementation
}

test('non-index source modules do not use re-export syntax', async () => {
  const sourceFiles = await listSourceFiles(SRC_ROOT)
  const nonIndexFiles = sourceFiles.filter((filePath) => path.basename(filePath) !== 'index.ts')

  for (const filePath of nonIndexFiles) {
    const source = await readFile(filePath, 'utf8')

    assert.doesNotMatch(
      source,
      /^\s*export\s+(?:type\s+)?(?:\{[\s\S]*?\}|\*)\s+from\s+['"][^'"]+['"]/m,
      `re-export found in ${path.relative(SRC_ROOT, filePath)}`,
    )
  }
})

test('non-index source modules are not pure forwarding facades', async () => {
  const sourceFiles = await listSourceFiles(SRC_ROOT)
  const nonIndexFiles = sourceFiles.filter((filePath) => path.basename(filePath) !== 'index.ts')

  for (const filePath of nonIndexFiles) {
    const source = await readFile(filePath, 'utf8')

    assert.equal(
      isPureForwardingModule(source),
      false,
      `forwarding facade found in ${path.relative(SRC_ROOT, filePath)}`,
    )
  }
})

test('non-index source modules do not alias imported bindings into exports', async () => {
  const sourceFiles = await listSourceFiles(SRC_ROOT)
  const nonIndexFiles = sourceFiles.filter((filePath) => path.basename(filePath) !== 'index.ts')

  for (const filePath of nonIndexFiles) {
    const source = await readFile(filePath, 'utf8')
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)
    const forwardedBindings = collectForwardedRelativeBindings(sourceFile)

    assert.deepEqual(
      forwardedBindings,
      [],
      `alias forwarding export found in ${path.relative(SRC_ROOT, filePath)}: ${forwardedBindings.join(', ')}`,
    )
  }
})

test('source tree does not keep runtime monolith modules', async () => {
  const sourceFiles = await listSourceFiles(SRC_ROOT)
  const relativePaths = new Set(sourceFiles.map((filePath) => path.relative(SRC_ROOT, filePath)))

  for (const relativePath of FORBIDDEN_RUNTIME_MODULES) {
    assert.equal(
      relativePaths.has(relativePath),
      false,
      `runtime monolith found in ${relativePath}`,
    )
  }
})

test('non-test implementation modules do not import templates or patching barrels', async () => {
  const sourceFiles = await listSourceFiles(SRC_ROOT)
  const productionFiles = sourceFiles.filter((filePath) => !filePath.endsWith('.test.ts'))

  for (const filePath of productionFiles) {
    if (path.basename(filePath) === 'index.ts') {
      continue
    }

    const source = await readFile(filePath, 'utf8')
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true)

    for (const moduleSpecifier of collectRelativeModuleSpecifiers(sourceFile)) {
      const resolvedImportPath = path.resolve(path.dirname(filePath), moduleSpecifier)
      const resolvedRelativePath = path
        .relative(SRC_ROOT, resolvedImportPath)
        .replace(/\.m?js$/, '.ts')

      assert.equal(
        FORBIDDEN_INTERNAL_BARRELS.has(resolvedRelativePath),
        false,
        `internal barrel import found in ${path.relative(SRC_ROOT, filePath)} -> ${moduleSpecifier}`,
      )
    }
  }
})
