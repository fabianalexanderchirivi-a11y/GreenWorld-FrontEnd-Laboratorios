import { useCallback,useEffect,useState } from 'react'
import api from '../api/api'
import { getStoredUser } from '../utils/auth'
export default function CourseReviews({courseId,enrolled}) {
 const user=getStoredUser()
 const [items,setItems]=useState([]),[text,setText]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const load=useCallback(async()=>{const r=await api.get(`/cursos/${courseId}/resenas`);setItems(r.data.data)},[courseId])
 useEffect(()=>{load().catch(()=>setError('No pudimos consultar las reseñas. Intenta más tarde.'))},[load])
 const save=async e=>{
  e.preventDefault();setBusy(true);setError('');setMessage('')
  try{await api.put(`/cursos/${courseId}/resena`,{contenido:text});await load();setText('');setMessage('Tu reseña quedó guardada.')}
  catch(e){setError(e.response?.data?.message||'No pudimos guardar la reseña.')}
  finally{setBusy(false)}
 }
 return <section className="course-progress-panel learning-content" aria-label="Reseñas del curso">
  <h2>Reseñas del curso</h2>
  {!items.length&&<p>Todavía no hay reseñas.</p>}
  {items.map(r=><article className="review-entry" key={r.id_resena}><strong>{r.autor}</strong><p>{r.contenido}</p>{r.id_usuario===user?.id_usuario&&<button className="btn btn-outline" onClick={()=>setText(r.contenido)} type="button">Editar mi reseña</button>}</article>)}
  {enrolled?<form onSubmit={save}><label htmlFor="review-content">Tu experiencia con el curso</label><textarea id="review-content" required maxLength={2000} value={text} onChange={e=>setText(e.target.value)} rows={4}/><p>Tu reseña es pública y se asocia a tu nombre. Guardar reemplaza únicamente tu reseña de este curso.</p><button className="btn btn-solid" disabled={busy||!text.trim()}>{busy?'Guardando…':'Guardar mi reseña'}</button></form>:<p>Inicia sesión e inscríbete en el curso para publicar tu experiencia.</p>}
  {message&&<p role="status">{message}</p>}{error&&<p role="alert" className="admin-error">{error}</p>}
 </section>
}
