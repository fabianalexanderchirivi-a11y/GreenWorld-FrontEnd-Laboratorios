import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'
import WorldGreen from '../img/WorldGreen.png'
import World from '../img/World.webp'
import Water from '../img/Water.webp'
import Bin from '../img/Bin.webp'
import Energy from '../img/Energy.webp'
import '../styles/home.css'

const highlightedCourses = [
  { name: 'Reciclaje básico', icon: Bin },
  { name: 'Energía y ahorro', icon: Energy },
  { name: 'Cuidado del agua', icon: Water },
  { name: 'Conservación', icon: World },
]

export default function Principal() {
  usePageTitle('Inicio')

  return (
    <main className="home-base">
      <section className="hero-base" aria-label="Sección principal">
        <article className="hero-content">
          <h1>Aprende y actúa por el planeta</h1>
          <p>
            El desperdicio de agua, los residuos y la pérdida de biodiversidad requieren decisiones informadas.
            Aprende sobre el cuidado de tu entorno con cursos ambientales, contenidos por módulos y seguimiento de tu avance.
          </p>

          <div className="hero-buttons">
            <Link to="/cursos" className="btn btn-solid">Explorar cursos</Link>
            <Link to="/retos" className="btn btn-outline">Unirme a un reto</Link>
          </div>
        </article>

        <aside className="hero-placeholder" aria-label="Espacio para imagen principal">
          <img src={WorldGreen} id="World" alt="Ilustración del planeta verde" />
        </aside>
      </section>

      <section className="featured-courses" aria-label="Cursos destacados">
        <h2>Cursos destacados</h2>

        <div className="course-grid">
          {highlightedCourses.map((course) => (
            <article key={course.name} className="course-card">
              <div className="course-icon">
                <img src={course.icon} alt={course.name} className="course-icon-img" />
              </div>
              <p>{course.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mission-vision" aria-label="Misión y visión">
        <div className="mission-vision-content">
          <article>
            <h3>Misión</h3>
            <p>
              Promover la educación ambiental a través de cursos accesibles y dinámicos que
              permitan a las personas comprender la importancia del cuidado del planeta.
              Buscamos fomentar hábitos sostenibles y acciones responsables
              que contribuyan a la protección del medio ambiente y al bienestar de las futuras generaciones.
            </p>
          </article>

          <article>
            <h3>Visión</h3>
            <p>
              Ser una plataforma educativa reconocida por inspirar a las personas a aprender, actuar
              y generar un impacto positivo en su entorno. Aspiramos a construir una comunidad
              comprometida con la sostenibilidad y la conservación del planeta mediante el
              conocimiento y la participación activa.
            </p>
          </article>
        </div>
      </section>

      <Footer />
    </main>
  )
}
