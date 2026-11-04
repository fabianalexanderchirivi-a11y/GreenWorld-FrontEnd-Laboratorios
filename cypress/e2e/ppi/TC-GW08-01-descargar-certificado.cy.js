import { loginByApi, visitWithSession } from '../../support/ppi'
import { validCertificateCourse } from '../../support/ppi-modules'

describe('TC-GW08-01 — Generar y descargar certificado', () => {
  it('descarga un PDF auténtico para un curso completado', () => {
    loginByApi().then((session) => {
      validCertificateCourse(session).then((course) => {
        cy.intercept('POST', `/api/cursos/${course.id_curso}/certificado`).as('issue')
        cy.intercept('GET', /\/api\/certificados\/\d+\/descargar$/).as('download')
        visitWithSession(`/cursos/${course.id_curso}`, session)
        cy.get('.course-state-pill').should('contain.text', 'Terminado')
        cy.contains('button', 'Descargar certificado').should('be.visible').click()

        cy.wait('@issue').then(({ response }) => {
          expect([200, 201]).to.include(response.statusCode)
          expect(response.body.data.codigo_certificado).to.match(/^GW-/)
          expect(response.body.data.url_certificado).to.match(/^\/api\/certificados\/\d+\/descargar$/)
          cy.wrap(response.body.data.id_certificado).as('certificateId')
        })
        cy.wait('@download').then(({ response }) => {
          expect(response.statusCode).to.eq(200)
          expect(response.headers['content-type']).to.include('application/pdf')
          expect(response.headers['content-disposition']).to.include('attachment')
        })
        cy.get('@certificateId').then((certificateId) => {
          cy.readFile(`${Cypress.config('downloadsFolder')}/greenworld-certificado-${certificateId}.pdf`, null).then((contents) => {
            expect(contents.subarray(0, 5).toString()).to.eq('%PDF-')
            expect(contents.length).to.be.greaterThan(1000)
          })
        })
        cy.screenshot('TC-GW08-01-descargar-certificado')
      })
    })
  })
})
