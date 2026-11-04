import { useCallback,useEffect,useState } from 'react'
import api from '../api/api'

export default function CourseLearning({courseId,enrolled,onChange}) {
 const [modules,setModules]=useState([]),[selected,setSelected]=useState(null)
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false)
 const load=useCallback(async()=>{
  if(!enrolled){setModules([]);return}
  setLoading(true)
  try{const r=await api.get(`/cursos/${courseId}/aprendizaje`);setModules(r.data.data);setError('')}
  catch{setError('No pudimos cargar los módulos. Vuelve a abrir el curso.')}
  finally{setLoading(false)}
 },[courseId,enrolled])
 useEffect(()=>{load()},[load])
 const active=modules.find(m=>m.id_modulo===selected)||modules[0]
 const complete=async()=>{
  setBusy(true);setError('')
  try{await api.put(`/cursos/${courseId}/modulos/${active.id_modulo}/completar`);await load();await onChange()}
  catch(e){setError(e.response?.data?.message||'No pudimos registrar el módulo. Intenta nuevamente.')}
  finally{setBusy(false)}
 }
 return <section id="learning-content" className="course-progress-panel learning-content" aria-label="Aprendizaje del curso">
  <h2>Aprende por módulos</h2>
  {!enrolled?<p>Inscríbete para acceder al contenido y registrar tu avance.</p>:loading?<p role="status">Cargando módulos…</p>:<>
   {!modules.length&&<p>Este curso todavía no tiene módulos disponibles. No puede finalizarse sin contenido.</p>}
   <nav className="learning-navigation" aria-label="Seleccionar módulo">{modules.map(m=><button key={m.id_modulo} type="button" className="btn btn-outline" aria-pressed={active?.id_modulo===m.id_modulo} onClick={()=>setSelected(m.id_modulo)}>{m.completado?'✓ ':''}{m.titulo}</button>)}</nav>
   {active&&<article aria-label="Contenido seleccionado">
    <h3>{active.titulo}</h3><p>{active.descripcion}</p>
    {active.contenido&&<div className="learning-text">{active.contenido}</div>}
    {/^https:\/\//i.test(active.video_url||'')&&<p><a href={active.video_url} target="_blank" rel="noopener noreferrer">Abrir recurso audiovisual</a></p>}
    {active.completado?<p role="status">Módulo completado</p>:<button className="btn btn-solid" type="button" disabled={busy||(!active.contenido&&!active.video_url)} onClick={complete}>{busy?'Guardando…':'Marcar módulo como completado'}</button>}
   </article>}
   <p>El avance cuenta los módulos completados del curso. Marcar un módulo registra tu confirmación de realización; no es una calificación académica.</p>
  </>}
  {error&&<p role="alert" className="admin-error">{error}</p>}
 </section>
}
