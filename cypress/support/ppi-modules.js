import { visitWithSession } from './ppi'

export const preparedCourse = (key) => (
  cy.env([key], { log: false }).then((values) => {
    const id = Number(values[key])
    expect(id, `curso sintético configurado en ${key}`).to.be.a('number').and.be.greaterThan(0)
    return cy.request('GET', '/api/courses').then(({ status, body }) => {
      expect(status).to.eq(200)
      const course = body.data.find((item) => Number(item.id_curso ?? item.id) === id)
      expect(course, 'curso preparado publicado').to.exist
      return { id, title: course.titulo ?? course.name }
    })
  })
)

const persistedProgress = (session, course, completed, total) => (
  cy.request({
    url: '/api/usuarios/me/cursos',
    headers: { Authorization: `Bearer ${session.token}` },
    log: false,
  }).then(({ status, body }) => {
    expect(status).to.eq(200)
    const saved = body.data.find((item) => Number(item.id_curso) === course.id)
    expect(saved, 'inscripción propia persistida').to.exist
    expect(Number(saved.total_modulos)).to.eq(total)
    expect(Number(saved.modulos_completados)).to.eq(completed)
    expect(Number(saved.porcentaje_avance)).to.eq(Number((completed * 100 / total).toFixed(2)))
    expect(saved.estado_progreso).to.eq(completed === total ? 'terminado' : 'en_progreso')
    expect(Number(saved.finalizacion_valida)).to.eq(completed === total ? 1 : 0)
    if (completed === total) expect(saved.fecha_finalizacion).to.be.a('string').and.not.be.empty
    return saved
  })
)

const persistedModules = (session, course) => cy.request({
  url: `/api/cursos/${course.id}/aprendizaje`,
  headers: { Authorization: `Bearer ${session.token}` },
  log: false,
}).then(({ status, body }) => {
  expect(status).to.eq(200)
  expect(body.data, 'módulos reales disponibles').to.have.length(2)
  body.data.forEach((module) => {
    expect(module.estado).to.eq('disponible')
    expect(module.contenido, 'contenido de aprendizaje real').to.be.a('string').and.not.be.empty
  })
  return body.data
})

export const completeCourseInUi = (session, course, {
  fresh = false,
  reloadIntermediate = false,
  screenshot = 'modulos-precondicion',
} = {}) => {
  cy.intercept('PUT', `/api/cursos/${course.id}/modulos/*/completar`).as('completeModule')
  cy.intercept('PUT', `/api/cursos/${course.id}/progreso`).as('manualProgress')
  visitWithSession(`/cursos/${course.id}`, session)
  cy.contains('h1', course.title).should('be.visible')

  cy.request({ url: '/api/usuarios/me/cursos', headers: { Authorization: `Bearer ${session.token}` }, log: false })
    .then(({ body }) => {
      const enrolled = body.data.find((item) => Number(item.id_curso) === course.id)
      if (!enrolled) {
        cy.intercept('POST', `/api/cursos/${course.id}/iniciar`).as('startPreparedCourse')
        cy.contains('button', 'Comenzar').click()
        cy.wait('@startPreparedCourse').its('response.statusCode').should('eq', 200)
      }
    })

  return cy.then(() => persistedModules(session, course)).then((modules) => {
    const alreadyCompleted = modules.filter((module) => Boolean(module.completado)).length
    if (fresh) expect(alreadyCompleted, 'curso nuevo sin módulos realizados').to.eq(0)
    if (alreadyCompleted < modules.length) {
      cy.contains('button', 'Terminar curso').should('be.disabled')
      cy.contains('button', 'Descargar certificado').should('not.exist')
    }
    let completed = alreadyCompleted
    modules.filter((module) => !module.completado).forEach((module) => {
      completed += 1
      const expectedCompleted = completed
      const percentage = Number((expectedCompleted * 100 / modules.length).toFixed(2))
      cy.contains('.learning-navigation button', module.titulo).click()
      cy.get('#learning-content h3').should('have.text', module.titulo)
      cy.get('#learning-content .learning-text').should('contain.text', module.contenido)
      cy.contains('#learning-content button', 'Marcar módulo como completado').click()
      cy.wait('@completeModule').then(({ request, response }) => {
        expect(request.url).to.include(`/modulos/${module.id_modulo}/completar`)
        expect(request.body || {}).not.to.have.property('porcentaje_avance')
        expect(request.body || {}).not.to.have.property('estado_progreso')
        expect(response.statusCode).to.eq(200)
        expect(Number(response.body.data.completados)).to.eq(expectedCompleted)
        expect(Number(response.body.data.total)).to.eq(modules.length)
      })
      cy.get('.course-progress-header strong').should('have.text', `${percentage}%`)
      cy.contains('#learning-content', 'Módulo completado').should('be.visible')
      cy.then(() => persistedProgress(session, course, expectedCompleted, modules.length))
      cy.then(() => persistedModules(session, course)).then((savedModules) => {
        const saved = savedModules.find((item) => item.id_modulo === module.id_modulo)
        expect(Boolean(saved.completado)).to.eq(true)
        expect(Number(saved.porcentaje)).to.eq(100)
      })
      if (expectedCompleted < modules.length) {
        cy.contains('button', 'Terminar curso').should('be.disabled')
        if (reloadIntermediate) {
          cy.reload()
          cy.get('.course-progress-header strong').should('have.text', `${percentage}%`)
          cy.contains('.learning-navigation button', module.titulo).should('contain.text', '✓')
        }
        cy.screenshot(`${screenshot}-avance-${percentage}`)
      }
    })
    cy.reload()
    cy.get('.course-state-pill').should('contain.text', 'Terminado')
    cy.get('.course-progress-header strong').should('have.text', '100%')
    cy.contains('button', 'Descargar certificado').should('be.visible')
    cy.get('@manualProgress.all').should('have.length', 0)
    cy.screenshot(screenshot)
    return cy.then(() => persistedProgress(session, course, modules.length, modules.length))
  })
}

// Independiente del orden de specs: si falta la precondición, se realiza por UI.
export const validCertificateCourse = (session) => preparedCourse('PPI_CERTIFICATE_COURSE_ID').then((course) => (
  cy.request({ url: '/api/usuarios/me/cursos', headers: { Authorization: `Bearer ${session.token}` }, log: false })
    .then(({ body }) => {
      const existing = body.data.find((item) => Number(item.id_curso) === course.id)
      if (existing?.estado_progreso === 'terminado' && Number(existing.finalizacion_valida) === 1) {
        return persistedModules(session, course).then((modules) => {
          expect(modules.every((module) => Boolean(module.completado) && Number(module.porcentaje) === 100)).to.eq(true)
          return persistedProgress(session, course, modules.length, modules.length)
        })
      }
      return completeCourseInUi(session, course, { screenshot: 'TC-GW08-01-precondicion-modulos' })
    })
))
