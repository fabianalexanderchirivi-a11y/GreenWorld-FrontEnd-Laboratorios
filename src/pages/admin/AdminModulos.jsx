import { useCallback,useEffect,useState } from 'react'
import { Link,useParams } from 'react-router-dom'
import api from '../../api/api'
import '../../styles/detail.css'
const blank={titulo:'',descripcion:'',contenido:'',video_url:'',orden_modulo:1,duracion_estimada:'',estado:'disponible'}
export default function AdminModulos(){
 const {id}=useParams()
 const [modules,setModules]=useState([]),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const load=useCallback(async()=>{const r=await api.get('/modulos/admin');setModules(r.data.data.filter(m=>String(m.id_curso)===id))},[id])
 useEffect(()=>{load().catch(()=>setError('No pudimos cargar los módulos.'))},[load])
 const save=async e=>{
  e.preventDefault();setBusy(true);setError('');setMessage('')
  try{await api[editing?'put':'post'](editing?`/modulos/${editing}`:'/modulos',{...form,id_curso:Number(id),orden_modulo:Number(form.orden_modulo)});await load();setForm(blank);setEditing(null);setMessage('Módulo guardado.')}
  catch(e){setError(e.response?.data?.message||'No pudimos guardar. Revisa el contenido e intenta de nuevo.')}
  finally{setBusy(false)}
 }
 return <main className="admin-page learning-content"><Link to="/admin/cursos">Volver a cursos</Link><h1>Módulos del curso</h1><p>Gestiona contenido y publicación antes de recibir inscripciones. Los cursos con participaciones conservan su contenido para mantener la trazabilidad.</p>
  {error&&<p role="alert" className="admin-error">{error}</p>}{message&&<p role="status">{message}</p>}
  {modules.map(m=><article className="review-entry" key={m.id_modulo}><strong>{m.orden_modulo}. {m.titulo}</strong><p>{m.estado}</p><button type="button" className="btn btn-outline" onClick={()=>{setEditing(m.id_modulo);setForm({...blank,...m})}}>Editar módulo</button></article>)}
  {!modules.length&&<p>Este curso no tiene módulos.</p>}
  <form className="admin-form" onSubmit={save}><h2>{editing?'Editar módulo':'Nuevo módulo'}</h2>
   {['titulo','descripcion','contenido','video_url','orden_modulo','duracion_estimada'].map(key=><label key={key}>{({titulo:'Título',descripcion:'Descripción',contenido:'Contenido de aprendizaje',video_url:'Video HTTPS (opcional)',orden_modulo:'Orden',duracion_estimada:'Duración estimada (opcional)'})[key]}
    {key==='contenido'?<textarea rows={8} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input type={key==='orden_modulo'?'number':key==='video_url'?'url':'text'} min={1} maxLength={key==='titulo'?150:key==='video_url'?255:undefined} required={['titulo','orden_modulo'].includes(key)} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}
   <label>Estado<select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option value="disponible">Disponible</option><option value="oculto">Oculto</option></select></label>
   <button className="btn btn-solid" disabled={busy}>{busy?'Guardando…':'Guardar módulo'}</button>{editing&&<button type="button" className="btn btn-outline" onClick={()=>{setEditing(null);setForm(blank)}}>Cancelar edición</button>}
  </form>
 </main>
}
