// Preparación exclusivamente por API real y UNA ejecución de los ocho casos.
// Las credenciales permanecen en memoria y no se escriben en las evidencias.
import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { spawn } from 'node:child_process'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const frontend = path.join(root, 'frontend')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const matrixRoot = path.join(root, 'docs/MEJORAS_PPI_FINAL')
const hasMatrix = await access(path.join(matrixRoot, 'trazabilidad/matriz.json')).then(() => true, () => false)
const evidenceRoot = hasMatrix ? path.join(matrixRoot, 'pruebas') : path.join(frontend, 'reports')
const evidence = path.join(evidenceRoot, `ppi-modulos-${stamp}`)
await mkdir(evidence, { recursive: true })
const api = process.env.PPI_API_URL || 'http://127.0.0.1:4000/api'
const rows = []
const secrets = []
let student, adminToken, childExit, regressionCount = 0

async function call(method, route, token, body, expected = 200) {
  const response = await fetch(api + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = await response.json()
  rows.push({ metodo: method, ruta: route, http: response.status, esperado: expected })
  if (response.status !== expected) throw new Error(`Preparación ${method} ${route}: HTTP ${response.status}, esperado ${expected}`)
  return result
}

async function sourceHashes() {
  const result = {}
  async function walk(folder) {
    for (const item of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, item.name)
      if (item.isDirectory()) await walk(file)
      else result[path.relative(root, file).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(file)).digest('hex')
    }
  }
  await walk(path.join(root, 'frontend/src'))
  await walk(path.join(root, 'backend/src'))
  return result
}

const before = await sourceHashes()
try {
  let adminEmail = process.env.PPI_ADMIN_EMAIL
  let adminPassword = process.env.PPI_ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    const privateData = JSON.parse(await readFile(path.join(root, 'backend/.env.learning-demo'), 'utf8'))
    adminEmail = privateData.accounts.admin.email
    adminPassword = privateData.accounts.admin.password
  }
  secrets.push(adminPassword)
  adminToken = (await call('POST', '/auth/login', null, { correo: adminEmail, contrasena: adminPassword })).token
  secrets.push(adminToken)

  const unique = randomUUID()
  const email = `ppi-modulos-${unique}@example.test`
  const password = randomBytes(24).toString('base64url')
  secrets.push(password)
  await call('POST', '/auth/register', null, { nombre: 'PPI', apellido: 'Modulos', correo: email, contrasena: password }, 201)
  student = await call('POST', '/auth/login', null, { correo: email, contrasena: password })
  secrets.push(student.token)

  const courses = []
  for (const purpose of ['finalización', 'progreso']) {
    const created = await call('POST', '/courses', adminToken, {
      titulo: `PPI módulos ${purpose} ${unique.slice(0, 8)}`,
      descripcion: 'Datos sintéticos para la regresión PPI: dos módulos reales, sin examen ni nota simulada.',
      imagen: 'Bin.webp', nivel: 'basico', categoria: 'Educación ambiental',
      duracion_estimada: '10 minutos', estado: 'publicado',
    }, 201)
    const id = created.data[0].id_curso
    const modules = []
    for (const [order, title, content] of [
      [1, 'Separar residuos', 'Identifica los materiales aprovechables de tu hogar. Separa el papel limpio de los restos de comida. Contenido sintético de preparación para la prueba PPI.'],
      [2, 'Cuidar el agua', 'Reconoce una acción cotidiana para reducir el desperdicio de agua, como cerrar la llave mientras te cepillas. La realización se confirma en la interfaz, sin calificación académica.'],
    ]) {
      const module = await call('POST', '/modulos', adminToken, {
        id_curso: id, titulo: title, descripcion: 'Módulo de prueba controlado', contenido: content,
        video_url: '', orden_modulo: order, duracion_estimada: '5 minutos', estado: 'disponible',
      }, 201)
      modules.push(module.data[0].id_modulo)
    }
    courses.push({ id, modules })
  }

  await writeFile(path.join(evidence, 'preparacion.json'), JSON.stringify({
    fecha: new Date().toISOString(), tipo: 'API real; cuenta y cursos sintéticos nuevos',
    cursos: courses, usuario_sintetico_id: student.usuario.id_usuario,
    modulos_completados_durante_preparacion: 0,
    certificado: 'Precondición comprobada o realizada mediante UI en TC-GW08-01; no depende del orden de specs',
    operaciones: rows,
  }, null, 2))

  const config = [
    `screenshotsFolder=${path.join(evidence, 'screenshots')}`,
    `videosFolder=${path.join(evidence, 'videos')}`,
    `downloadsFolder=${path.join(evidence, 'downloads')}`,
    'trashAssetsBeforeRuns=false', 'retries=0',
  ].join(',')
  const args = ['node_modules/cypress/bin/cypress', 'run', '--spec', 'cypress/e2e/ppi/*.cy.js', '--config', config]
  regressionCount += 1
  const child = spawn(process.execPath, args, {
    cwd: frontend,
    env: { ...process.env, CYPRESS_NO_COMMAND_LOG: '1', CYPRESS_USER_EMAIL: email, CYPRESS_USER_PASSWORD: password,
      CYPRESS_PPI_FINISH_COURSE_ID: String(courses[0].id), CYPRESS_PPI_PROGRESS_COURSE_ID: String(courses[1].id),
      CYPRESS_PPI_CERTIFICATE_COURSE_ID: String(courses[0].id) },
  })
  let log = ''
  const append = (buffer) => { const text = buffer.toString(); log += text; process.stdout.write(text) }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  childExit = await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve) })
  // Verificación de privacidad antes de conservar el log.
  if (secrets.some((value) => value && log.includes(value))) throw new Error('El log contiene una credencial; no se guardó')
  await writeFile(path.join(evidence, 'regresion.log'), log)

  const clean = log.replace(/\u001b\[[0-9;]*m/g, '')
  const blocks = [...clean.matchAll(/Running:\s+(TC-GW\d+-\d+[^\s]*\.cy\.js)/g)]
  const results = blocks.map((match, index) => {
    const block = clean.slice(match.index, blocks[index + 1]?.index ?? clean.length)
    const passing = Number(block.match(/Passing:\s+(\d+)/)?.[1] ?? 0)
    const failing = Number(block.match(/Failing:\s+(\d+)/)?.[1] ?? 0)
    const tests = Number(block.match(/Tests:\s+(\d+)/)?.[1] ?? 0)
    return { id: match[1].match(/^TC-GW\d+-\d+/)[0], spec: match[1], pruebas: tests, pasa: passing, falla: failing,
      estado: failing ? 'Falla' : tests === 1 && passing === 1 ? 'Pasa' : 'No ejecutado/completo' }
  })
  const summary = {
    fecha: new Date().toISOString(), zona_horaria: 'America/Bogota', ejecuciones_completas_lanzadas: regressionCount,
    reintentos_automaticos: 0, exit_code: childExit, resultados: results,
    pasa: results.filter((r) => r.estado === 'Pasa').length, falla: results.filter((r) => r.estado === 'Falla').length,
    alcance: 'Frontend, backend y SQL reales; módulos realizados solo mediante UI; sin respuestas simuladas',
  }
  await writeFile(path.join(evidence, 'resultados.json'), JSON.stringify(summary, null, 2))
  if (results.length !== 8 || results.some((r) => r.pruebas !== 1)) throw new Error('Revisar log: no se pudo confirmar la ejecución completa de los ocho casos')

  if (hasMatrix) {
    const matrixFile = path.join(root, 'docs/MEJORAS_PPI_FINAL/trazabilidad/matriz.json')
    const matrix = JSON.parse(await readFile(matrixFile, 'utf8'))
    const relativeEvidence = path.relative(path.join(root, 'docs/MEJORAS_PPI_FINAL'), evidence).replaceAll('\\', '/')
    for (const result of results) {
      const row = matrix.find((entry) => entry.Prueba === result.id)
      if (!row) throw new Error(`Caso no encontrado en matriz: ${result.id}`)
      row.Resultado = `${result.estado} — regresión única por módulos`
      row.Evidencia = `${relativeEvidence}/resultados.json; ${relativeEvidence}/regresion.log; ${relativeEvidence}/screenshots/${result.spec}/; ${relativeEvidence}/videos/${result.spec}.mp4`
    }
    await writeFile(matrixFile, JSON.stringify(matrix, null, 2) + '\n')
    const headers = Object.keys(matrix[0])
    let markdown = '# Matriz editable de trazabilidad\n\nLos ocho casos PPI conservan sus IDs. Sus estados se actualizaron con la regresión única por módulos de esta ejecución; los demás resultados y pendientes conservan su alcance anterior. RF-PPI y UC nuevos siguen siendo propuestas locales. Los logs anteriores se conservan como historial.\n\n'
    markdown += '| ' + headers.join(' | ') + ' |\n| ' + headers.map(() => '---').join(' | ') + ' |\n'
    for (const row of matrix) markdown += '| ' + headers.map((key) => String(row[key]).replaceAll('|', '/')).join(' | ') + ' |\n'
    await writeFile(path.join(root, 'docs/MEJORAS_PPI_FINAL/trazabilidad/MATRIZ.md'), markdown)
  }
  console.log(JSON.stringify({ evidencia: evidence, pasa: summary.pasa, falla: summary.falla, ejecuciones: regressionCount }))
  process.exitCode = childExit || 0
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  if (student?.token) {
    try {
      await call('DELETE', '/usuarios/me', student.token)
      await writeFile(path.join(evidence, 'limpieza.json'), JSON.stringify({ cuenta_sintetica_desactivada: true, datos_borrados: 0 }, null, 2))
    } catch {
      await writeFile(path.join(evidence, 'limpieza.json'), JSON.stringify({ cuenta_sintetica_desactivada: false, pendiente: 'Revisar cuenta sintética de esta ejecución; no se borraron datos' }, null, 2))
    }
  }
  const after = await sourceHashes()
  const changed = Object.keys(before).filter((file) => before[file] !== after[file])
  await writeFile(path.join(evidence, 'integridad-producto.json'), JSON.stringify({ codigo_producto_modificado: changed, ejecuciones_cypress: regressionCount }, null, 2))
}
