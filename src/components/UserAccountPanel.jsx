import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/api'
import { getStoredUser } from '../utils/auth'
import { resolveImage } from '../utils/imageResolver'

const UserIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 11.6c4.16 0 7.8 2.08 7.8 4.72 0 .7-.57 1.28-1.28 1.28H5.48c-.71 0-1.28-.58-1.28-1.28 0-2.64 3.64-4.72 7.8-4.72Z" fill="currentColor" />
  </svg>
)

const getFullName = (usuario) => {
  const nombreCompleto = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ').trim()
  return nombreCompleto || 'Usuario GreenWorld'
}

const getCreationDate = (usuario) => {
  const rawDate = usuario?.fecha_creacion || usuario?.fecha_registro || usuario?.created_at

  if (!rawDate) {
    return ''
  }

  const parsedDate = new Date(rawDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getTitle = (item, fallback) => item?.titulo || item?.name || fallback
const getItemImage = (item) => resolveImage(item?.imagen || item?.imagen_url || item?.image)
const formatDifficulty = (difficulty) => (
  difficulty === 'Basico' || difficulty === 'basico' ? 'Básico' : difficulty
)
const getEstadoText = (item) => {
  if (item?.estado_progreso === 'terminado') {
    return 'Terminado'
  }

  if (item?.estado_progreso === 'en_progreso') {
    return 'En progreso'
  }

  return item?.estado || 'En progreso'
}

function ProgressSection({ title, items, emptyMessage, detailResolver, actionLabel, actionTo, emptyActionLabel, emptyActionTo }) {
  return (
    <section className="profile-section">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <div className="profile-list">
          {items.map((item) => (
            <article className="profile-item" key={item.id_inscripcion || item.id_usuario_reto || item.id_curso || item.id_reto}>
              <img className="profile-item-image" src={getItemImage(item)} alt={getTitle(item, title)} />
              <div className="profile-item-content">
                <strong>{getTitle(item, title)}</strong>
                <span>{detailResolver(item)}</span>
                <small>{getEstadoText(item)}</small>
                {actionLabel && actionTo && item.estado_progreso === 'en_progreso' && (
                  <Link className="profile-item-action" to={actionTo}>
                    {actionLabel}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="profile-empty-block">
          <p className="profile-empty">{emptyMessage}</p>
          {emptyActionLabel && emptyActionTo && (
            <Link className="profile-item-action" to={emptyActionTo}>
              {emptyActionLabel}
            </Link>
          )}
        </div>
      )}
    </section>
  )
}

export default function UserAccountPanel({ mode = 'panel' }) {
  const usuario = getStoredUser()
  const [courses, setCourses] = useState([])
  const [retos, setRetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const cargarResumen = async () => {
      const [coursesResponse, retosResponse] = await Promise.allSettled([
        api.get('/usuarios/me/cursos'),
        api.get('/usuarios/me/retos')
      ])

      if (!mounted) {
        return
      }

      const loadedCourses = coursesResponse.status === 'fulfilled' && Array.isArray(coursesResponse.value.data?.data)
        ? coursesResponse.value.data.data
        : []
      const loadedRetos = retosResponse.status === 'fulfilled' && Array.isArray(retosResponse.value.data?.data)
        ? retosResponse.value.data.data
        : []

      setCourses(loadedCourses)
      setRetos(loadedRetos)
      setError(coursesResponse.status === 'rejected' && retosResponse.status === 'rejected'
        ? 'No pudimos cargar tu actividad en este momento.'
        : '')
      setLoading(false)
    }

    cargarResumen()

    return () => {
      mounted = false
    }
  }, [])

  const cursosEnProgreso = useMemo(
    () => courses.filter((course) => course.estado_progreso === 'en_progreso'),
    [courses]
  )
  const cursosTerminados = useMemo(
    () => courses.filter((course) => course.estado_progreso === 'terminado'),
    [courses]
  )
  const retosEnProgreso = useMemo(
    () => retos.filter((reto) => reto.estado_progreso === 'en_progreso'),
    [retos]
  )
  const retosTerminados = useMemo(
    () => retos.filter((reto) => reto.estado_progreso === 'terminado'),
    [retos]
  )

  const nombre = getFullName(usuario)
  const fechaCreacion = getCreationDate(usuario)
  const isProfile = mode === 'profile'

  return (
    <main className="admin-page">
      <section className="profile-panel">
        <aside className="profile-sidebar" aria-label="Menu personal">
          <Link className={`profile-nav-link ${!isProfile ? 'is-active' : ''}`} to="/panel-usuario">
            Inicio
          </Link>
          <Link className="profile-nav-link" to="/mis-cursos">
            Mis cursos
          </Link>
          <Link className="profile-nav-link" to="/mis-retos">
            Mis retos
          </Link>
        </aside>

        <section className="profile-main">
          <div className="profile-heading">
            <h1>{isProfile ? 'Perfil' : `Hola, ${usuario?.nombre || 'Usuario'}`}</h1>
            <p>{isProfile ? 'Organiza tu información y revisa tu avance.' : 'Este es tu resumen general en GreenWorld.'}</p>
          </div>

          <section className="profile-hero" aria-label="Información del usuario">
            <div className="profile-avatar">
              <UserIcon />
            </div>
            <div className="profile-user-info">
              <h2>{nombre}</h2>
              {usuario?.correo && <p className="profile-email">{usuario.correo}</p>}
              {fechaCreacion && <p className="profile-created">Cuenta creada el {fechaCreacion}</p>}
            </div>
            {!isProfile && (
              <div className="profile-user-actions">
                <Link className="profile-item-action profile-edit-action" to="/editar-perfil">
                  Editar perfil
                </Link>
              </div>
            )}
          </section>

          {loading && <p className="admin-state">Cargando tu actividad...</p>}
          {error && <p className="admin-state admin-error">{error}</p>}

          {!loading && (
            <>
              <section className="profile-stats" aria-label="Resumen de progreso">
                <Link className="profile-stat" to="/mis-cursos">
                  <strong>{cursosEnProgreso.length}</strong>
                  <span>Cursos en progreso</span>
                </Link>
                <Link className="profile-stat" to="/mis-cursos">
                  <strong>{cursosTerminados.length}</strong>
                  <span>Cursos terminados</span>
                </Link>
                <Link className="profile-stat" to="/mis-retos">
                  <strong>{retosEnProgreso.length}</strong>
                  <span>Retos en progreso</span>
                </Link>
                <Link className="profile-stat" to="/mis-retos">
                  <strong>{retosTerminados.length}</strong>
                  <span>Retos terminados</span>
                </Link>
              </section>

              <section className="profile-sections" aria-label="Actividad reciente">
                <section className="profile-section" aria-label="Certificados obtenidos">
                  <h2>Certificados obtenidos</h2>
                  {courses.filter(c=>c.id_certificado).length?courses.filter(c=>c.id_certificado).map(c=><p key={c.id_certificado}><Link className="profile-item-action" to={`/cursos/${c.id_curso}`}>{c.titulo}: consultar y descargar certificado</Link></p>):<p>Aún no tienes certificados emitidos con módulos verificados.</p>}
                  <Link className="profile-item-action" to="/cursos">Explorar cursos disponibles</Link>
                </section>
                <ProgressSection
                  title="Cursos en progreso"
                  items={cursosEnProgreso}
                  emptyMessage="No tienes cursos en progreso todavía."
                  detailResolver={(course) => `${Number(course.porcentaje_avance || 0)}% de avance`}
                  actionLabel="Continuar"
                  actionTo="/mis-cursos"
                  emptyActionLabel="Explorar cursos"
                  emptyActionTo="/cursos"
                />
                <ProgressSection
                  title="Cursos terminados"
                  items={cursosTerminados}
                  emptyMessage="No tienes cursos terminados todavía."
                  detailResolver={(course) => `${Number(course.porcentaje_avance || 100)}% de avance`}
                />
                <ProgressSection
                  title="Retos en progreso"
                  items={retosEnProgreso}
                  emptyMessage="No tienes retos en progreso todavía."
                  detailResolver={(reto) => formatDifficulty(reto.dificultad) || 'En progreso'}
                  actionLabel="Ver reto"
                  actionTo="/mis-retos"
                  emptyActionLabel="Ver retos disponibles"
                  emptyActionTo="/retos"
                />
                <ProgressSection
                  title="Retos terminados"
                  items={retosTerminados}
                  emptyMessage="No tienes retos terminados todavía."
                  detailResolver={() => 'Terminado'}
                />
              </section>
            </>
          )}
        </section>
      </section>
    </main>
  )
}
