import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MainHeader from './components/MainHeader'
import Cursos from './pages/Cursos'
import AdminModulos from './pages/admin/AdminModulos'
import Principal from './pages/Principal'
import Retos from './pages/Retos'
import CursoDetalle from './pages/CursoDetalle'
import RetoDetalle from './pages/RetoDetalle'
import Login from './pages/Login'
import Register from './pages/Register'
import PanelUsuario from './pages/PanelUsuario'
import Perfil from './pages/Perfil'
import EditarPerfil from './pages/EditarPerfil'
import MisCursos from './pages/MisCursos'
import MisRetos from './pages/MisRetos'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCursos from './pages/admin/AdminCursos'
import CrearCurso from './pages/admin/CrearCurso'
import EditarCurso from './pages/admin/EditarCurso'
import AdminRetos from './pages/admin/AdminRetos'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminInscripciones from './pages/admin/AdminInscripciones'
import { getStoredUser } from './utils/auth'
import './styles/layout.css'

function AppContent() {
  const location = useLocation()
  const isAuthRoute = ['/login', '/register'].includes(location.pathname)
  const usuario = getStoredUser()
  const homeElement = usuario
    ? <Navigate to={usuario.rol === 'admin' ? '/admin' : '/panel-usuario'} replace />
    : <Principal />

  return (
    <div className={isAuthRoute ? 'route-login' : 'app-shell'}>
      {!isAuthRoute && <MainHeader />}
      <Routes>
        <Route path="/" element={homeElement} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/cursos/:id" element={<CursoDetalle />} />
        <Route path="/docentes" element={<Navigate to="/cursos" replace />} />
        <Route path="/retos" element={<Retos />} />
        <Route path="/retos/:id" element={<RetoDetalle />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/panel-usuario" element={<PanelUsuario />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/editar-perfil" element={<EditarPerfil />} />
          <Route path="/mis-cursos" element={<MisCursos />} />
          <Route path="/mis-retos" element={<MisRetos />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/cursos" element={<AdminCursos />} />
          <Route path="/admin/cursos/:id/modulos" element={<AdminModulos />} />
          <Route path="/admin/cursos/crear" element={<CrearCurso />} />
          <Route path="/admin/cursos/editar/:id" element={<EditarCurso />} />
          <Route path="/admin/retos" element={<AdminRetos />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/inscripciones" element={<AdminInscripciones />} />
        </Route>
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
