import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/api'
import usePageTitle from '../hooks/usePageTitle'
import { getStoredToken } from '../utils/auth'
import { resolveImage } from '../utils/imageResolver'
import '../styles/detail.css'
import CourseLearning from '../components/CourseLearning'
import CourseReviews from '../components/CourseReviews'

const getCourseId = (course) => course.id_curso || course.id
const getProgressLabel = (estado) => {
  if (estado === 'terminado') return 'Terminado'
  if (estado === 'en_progreso') return 'En progreso'
  return 'Sin iniciar'
}
const formatLevel = (level) => (
  level === 'basico' || level === 'Basico' ? 'Básico' : level
)

export default function CursoDetalle() {
  usePageTitle('Detalle de curso')

  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  const estado = progress?.estado_progreso || 'sin_iniciar'
  const porcentaje = Number(progress?.porcentaje_avance || (estado === 'terminado' ? 100 : 0))

  useEffect(() => {
    let mounted = true

    const cargarDetalle = async () => {
      try {
        const [coursesResponse, myCoursesResponse, modulesResponse] = await Promise.all([
          api.get('/courses'),
          getStoredToken()
            ? api.get('/usuarios/me/cursos').catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
          api.get('/modulos').catch(() => ({ data: { data: [] } }))
        ])

        if (!mounted) return

        const courses = Array.isArray(coursesResponse.data?.data) ? coursesResponse.data.data : []
        const selectedCourse = courses.find((item) => String(getCourseId(item)) === String(id))
        const userCourses = Array.isArray(myCoursesResponse.data?.data) ? myCoursesResponse.data.data : []
        const selectedProgress = userCourses.find((item) => String(getCourseId(item)) === String(id))
        const allModules = Array.isArray(modulesResponse.data?.data) ? modulesResponse.data.data : []

        setCourse(selectedCourse || null)
        setProgress(selectedProgress || null)
        setModules(allModules.filter((module) => String(module.id_curso) === String(id)))
        setError(selectedCourse ? '' : 'Curso no encontrado')
      } catch (courseError) {
        if (mounted) {
          setError(courseError.response?.data?.message || 'No se pudo cargar el curso')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    cargarDetalle()

    return () => {
      mounted = false
    }
  }, [id])

  const sortedModules = useMemo(
    () => [...modules].sort((first, second) => Number(first.orden_modulo || 0) - Number(second.orden_modulo || 0)),
    [modules]
  )
  const visibleModules = sortedModules
  const hasRealModules = sortedModules.length > 0

  const volverAtras = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/cursos')
  }

  const startCourse = async () => {
    if (!getStoredToken()) {
      navigate('/login')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await api.post(`/cursos/${id}/iniciar`)
      setProgress(response.data?.data || { id_curso: id, estado_progreso: 'en_progreso', porcentaje_avance: 0 })
    } catch (courseError) {
      setError(courseError.response?.data?.message || 'No se pudo iniciar el curso')
    } finally {
      setSaving(false)
    }
  }

  const refreshProgress = async () => {
    const response=await api.get('/usuarios/me/cursos')
    setProgress(response.data.data.find(item=>String(getCourseId(item))===String(id))||null)
  }

  const finishCourse = async () => {
    setSaving(true)
    setError('')

    try {
      const response = await api.put(`/cursos/${id}/progreso`, {
        estado_progreso: 'terminado',
        porcentaje_avance: 100
      })
      setProgress(response.data?.data || { ...progress, estado_progreso: 'terminado', porcentaje_avance: 100 })
    } catch (courseError) {
      setError(courseError.response?.data?.message || 'No se pudo terminar el curso')
    } finally {
      setSaving(false)
    }
  }

  const cancelCourse = async () => {
    setSaving(true)
    setError('')

    try {
      await api.put(`/cursos/${id}/cancelar`)
      setProgress(null)
    } catch (courseError) {
      setError(courseError.response?.data?.message || 'No se pudo cancelar el curso')
    } finally {
      setSaving(false)
    }
  }

  const downloadCertificate = async () => {
    if (!getStoredToken()) {
      navigate('/login')
      return
    }

    setDownloading(true)
    setError('')

    try {
      const issued = await api.post(`/cursos/${id}/certificado`)
      const certificateId = issued.data?.data?.id_certificado
      if (!certificateId) throw new Error('El certificado no tiene identificador')

      const response = await api.get(`/certificados/${certificateId}/descargar`, { responseType: 'blob' })
      if (!response.headers['content-type']?.includes('application/pdf')) {
        throw new Error('La descarga no devolvió un PDF')
      }

      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `greenworld-certificado-${certificateId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (certificateError) {
      setError(certificateError.response?.data?.message || certificateError.message || 'No se pudo descargar el certificado')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <main className="detail-page"><p className="admin-state">Cargando curso...</p></main>
  }

  if (error && !course) {
    return <main className="detail-page"><p className="admin-state admin-error">{error}</p></main>
  }

  return (
    <main className="detail-page course-detail-page">
      {error && <p className="admin-state admin-error">{error}</p>}

      <button type="button" className="detail-back-button" onClick={volverAtras}>
        Volver
      </button>

      <section className="course-detail-layout">
        <aside className="course-content-sidebar" aria-label="Contenido del curso">
          <h2>Contenido del curso</h2>
          {!hasRealModules && <p className="course-content-note">Aún no hay módulos publicados.</p>}
          <div className="course-module-list">
            {visibleModules.map((module, index) => (
              <article key={module.id_modulo || module.orden_modulo || module.titulo} className="course-module-item">
                <span>{index + 1}</span>
                <div>
                  <strong>{module.titulo}</strong>
                  {module.descripcion && <small>{module.descripcion}</small>}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <section className="course-detail-main">
          <article className="course-main-card">
            <div className="course-main-copy">
              <span className="course-state-pill">{getProgressLabel(estado)}</span>
              <h1>{course.titulo || course.name}</h1>
              <p>{course.descripcion || course.description}</p>
              <div className="detail-actions course-main-actions">
                {estado === 'sin_iniciar' && (
                  <button type="button" className="btn btn-solid" disabled={saving} onClick={startCourse}>
                    {saving ? 'Iniciando...' : 'Comenzar'}
                  </button>
                )}
                {estado === 'en_progreso' && (
                  <>
                    <a className="btn btn-solid" href="#learning-content">Continuar</a>
                    <button type="button" className="btn btn-outline" disabled={saving||porcentaje<100} onClick={finishCourse}>Terminar curso</button>
                    <button type="button" className="btn btn-outline" disabled={saving} onClick={cancelCourse}>Cancelar curso</button>
                  </>
                )}
                {estado === 'terminado' && (
                  <>
                    <span className="user-progress-badge">Curso terminado</span>
                    <button type="button" className="btn btn-solid" disabled={downloading} onClick={downloadCertificate}>
                      {downloading ? 'Descargando...' : 'Descargar certificado'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="course-main-image">
              <img src={resolveImage(course.imagen || course.image)} alt={course.titulo || course.name} />
            </div>
          </article>

          <section className="course-info-grid" aria-label="Información del curso">
            <article>
              <span>Nivel</span>
              <strong>{formatLevel(course.nivel || course.level) || 'No definido'}</strong>
            </article>
            <article>
              <span>Duración</span>
              <strong>{course.duracion_estimada || 'No definida'}</strong>
            </article>
            <article>
              <span>Categoría</span>
              <strong>{course.categoria || course.category || 'General'}</strong>
            </article>
            <article>
              <span>Progreso</span>
              <strong>{porcentaje}%</strong>
            </article>
          </section>

          <section className="course-progress-panel" aria-label="Progreso del curso">
            <div className="course-progress-header">
              <span>Avance del curso</span>
              <strong>{porcentaje}%</strong>
            </div>
            <div className="progress-bar detail-progress" aria-label={`Avance ${porcentaje}%`}>
              <span style={{ width: `${Math.min(porcentaje, 100)}%` }} />
            </div>
          </section>
          {progress?.finalizacion_historica_sin_validar===1&&<p role="status">La finalización anterior no tiene módulos verificados. Completa los contenidos para validar tu certificado.</p>}
          <CourseLearning courseId={id} enrolled={Boolean(progress)} onChange={refreshProgress}/>
          <CourseReviews courseId={id} enrolled={Boolean(progress)}/>
        </section>
      </section>
    </main>
  )
}
