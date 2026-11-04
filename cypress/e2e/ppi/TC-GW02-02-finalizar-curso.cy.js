import { loginByApi } from '../../support/ppi'
import { preparedCourse, completeCourseInUi } from '../../support/ppi-modules'

describe('TC-GW02-02 — Finalizar un curso mediante sus módulos', () => {
  it('realiza los módulos por la interfaz y persiste la finalización derivada', () => {
    loginByApi().then((session) => (
      preparedCourse('PPI_FINISH_COURSE_ID').then((course) => (
        completeCourseInUi(session, course, {
          fresh: true,
          screenshot: 'TC-GW02-02-finalizar-curso',
        })
      ))
    ))
  })
})
