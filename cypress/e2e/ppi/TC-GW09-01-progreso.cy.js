import { loginByApi } from '../../support/ppi'
import { preparedCourse, completeCourseInUi } from '../../support/ppi-modules'

describe('TC-GW09-01 — Registrar avance mediante módulos realizados', () => {
  it('conserva el avance intermedio y final después de recargar y consultar la API', () => {
    loginByApi().then((session) => (
      preparedCourse('PPI_PROGRESS_COURSE_ID').then((course) => (
        completeCourseInUi(session, course, {
          fresh: true,
          reloadIntermediate: true,
          screenshot: 'TC-GW09-01-progreso',
        })
      ))
    ))
  })
})
