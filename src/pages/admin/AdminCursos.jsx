import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import usePageTitle from '../../hooks/usePageTitle'
import '../../styles/admin.css'

const getCourseId = (course) => course.id_curso || course.id
const formatLevel = (level) => (
  level === 'basico' || level === 'Basico' ? 'básico' : level
)

export default function AdminCursos() {
  usePageTitle('Cursos Admin')

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const cargarCursos = async () => {
    setLoading(true)
    setError('')

    try {
      const respuesta = await api.get('/courses/admin')
      setCourses(Array.isArray(respuesta.data?.data) ? respuesta.data.data : [])
    } catch (coursesError) {
      setError(coursesError.response?.data?.message || 'No se pudieron cargar los cursos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCursos()
  }, [])

  const desactivarCurso = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este curso?')) {
      return
    }

    setMessage('')
    setError('')

    try {
      await api.delete(`/courses/${id}`)
      setMessage('Curso desactivado correctamente')
      await cargarCursos()
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'No se pudo desactivar el curso')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-header admin-header-row">
        <div>
          <h1>Cursos Admin</h1>
          <p>Lista, edita y desactiva cursos guardados en GreenWorld.</p>
        </div>
        <Link to="/admin/cursos/crear" className="btn btn-solid">Crear curso</Link>
      </section>

      {loading && <p className="admin-state">Cargando cursos...</p>}
      {error && <p className="admin-state admin-error">{error}</p>}
      {message && <p className="admin-state admin-success">{message}</p>}

      {!loading && courses.length === 0 && !error && (
        <p className="admin-state">Aún no hay cursos registrados.</p>
      )}

      {courses.length > 0 && (
        <div className="admin-table-wrap">
          <div className="admin-table" role="table" aria-label="Cursos">
          <div className="admin-table-row admin-table-head" role="row">
            <span>Título</span>
            <span>Categoría</span>
            <span>Nivel</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {courses.map((course) => (
            <div className="admin-table-row" role="row" key={getCourseId(course)}>
              <span>{course.titulo || course.name}</span>
              <span>{course.categoria || course.category || 'General'}</span>
              <span>{formatLevel(course.nivel || course.level)}</span>
              <span>{course.estado || 'activo'}</span>
              <span className="admin-row-actions">
                <Link to={`/admin/cursos/${getCourseId(course)}/modulos`} className="btn btn-outline">Módulos</Link>
                <Link to={`/admin/cursos/editar/${getCourseId(course)}`} className="btn btn-outline">Editar</Link>
                <button type="button" className="btn btn-outline" onClick={() => desactivarCurso(getCourseId(course))}>
                  Desactivar
                </button>
              </span>
            </div>
          ))}
          </div>
        </div>
      )}
    </main>
  )
}
