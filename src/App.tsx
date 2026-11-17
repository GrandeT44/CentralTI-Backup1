import { TicketDetail } from './pages/TicketDetail'
import { Tickets } from './pages/Tickets'
import { Profile } from './pages/Profile'
import { AppHeader } from './layouts/AppHeader'
import { Dashboard } from './pages/Dashboard'
import { fromSaoPaulo, localDateTime } from './dateTime'
import { Reports } from './features/Reports'
import { Knowledge, Article } from './features/Knowledge'
import { Planning } from './features/Planning'
import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import type { Data, Ticket } from './domain'
import { repository } from './repository'
import './App.css'
import './styles/redesign.css'
type Ctx={data:Data;save:(d:Data)=>void;active:string;setActive:(s:string)=>void}
const id=()=>crypto.randomUUID()
const statuses:Ticket['status'][]=['Aberto','Em andamento','Aguardando terceiros','Concluído','Cancelado']
const cats=['Hardware','Sistemas','Periféricos','Rede','Acessos','Segurança','Outros']
function Layout({c}:{c:Ctx}){return <div className="app-shell"><AppHeader technicians={c.data.technicians} active={c.active} setActive={c.setActive}/><main className="app-content"><Routes><Route path="/" element={<Dashboard data={c.data} active={c.active}/>}/><Route path="/chamados" element={<Tickets data={c.data} save={c.save} active={c.active}/>}/><Route path="/chamados/novo" element={<NewTicket c={c}/>}/><Route path="/chamados/:ticketId" element={<TicketDetail data={c.data} save={c.save} active={c.active}/>}/><Route path="/planejamento" element={<Planning data={c.data} save={c.save} active={c.active}/>}/><Route path="/conhecimento" element={<Knowledge data={c.data} save={c.save}/>}/><Route path="/conhecimento/:articleId" element={<Article data={c.data} save={c.save}/>}/><Route path="/relatorios" element={<Reports data={c.data}/>}/><Route path="/perfil" element={<Profile data={c.data} save={c.save} active={c.active}/>}/></Routes></main></div>}
function Title({section,title,sub}:{section:string;title:string;sub:string}){return <div className="title"><span className="eyebrow">{section}</span><h1>{title}</h1><p>{sub}</p></div>}
function NewTicket({c}:{c:Ctx}){const go=useNavigate();const [params]=useSearchParams();const [type,setType]=useState<'quick'|'long'>(()=>params.get('tipo')==='rapido'?'quick':'long');const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [employee,setEmployee]=useState('');const [owner,setOwner]=useState(c.active);const [category,setCategory]=useState(cats[0]);const [priority,setPriority]=useState<Ticket['priority']>('Média');const [due,setDue]=useState('');const [solution,setSolution]=useState('');const [duration,setDuration]=useState('');const [occurredAt,setOccurredAt]=useState(localDateTime(new Date()));const [initialStatus,setInitialStatus]=useState<Ticket['status']>('Aberto');const [participants,setParticipants]=useState<string[]>([]);function submit(e:React.FormEvent){e.preventDefault();if((type==='quick'||initialStatus==='Concluído')&&!solution.trim())return;const number=Math.max(1042,...c.data.tickets.map(t=>Number(t.id.slice(3))||0))+1;const ticket:Ticket={id:`TI-${number}`,type,title,description,employee,createdById:c.active,ownerId:owner,category,priority,status:type==='quick'?'Concluído':initialStatus,openedAt:fromSaoPaulo(occurredAt),dueAt:due?fromSaoPaulo(`${due}T23:59`):undefined,completedAt:type==='quick'||initialStatus==='Concluído'?fromSaoPaulo(occurredAt):undefined,solution,durationMinutes:duration?Number(duration):undefined,participants:[...new Set([...participants,...(owner!==c.active?[owner]:[])])].map(technicianId=>({technicianId,worked:false})),progress:[]};const workStart=new Date(ticket.openedAt);const workEnd=new Date(workStart.getTime()+Number(duration)*60000);const sessions=type==='quick'&&Number(duration)>0?[...c.data.sessions,{id:id(),ticketId:ticket.id,technicianId:owner,start:workStart.toISOString(),end:workEnd.toISOString(),note:'Atendimento rápido'}]:c.data.sessions;c.save({...c.data,tickets:[ticket,...c.data.tickets],sessions});go(`/chamados/${ticket.id}`)}return <><Title section="CHAMADOS / NOVO" title="Novo chamado" sub="Registre um atendimento ou acompanhe uma atividade."/><form className="panel form" onSubmit={submit}><div className="tabs"><button type="button" className={type==='long'?'selected':''} onClick={()=>setType('long')}>Atividade prolongada</button><button type="button" className={type==='quick'?'selected':''} onClick={()=>setType('quick')}>Atendimento rápido</button></div><div className="form-grid"><label className="full">Título *<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="full">Descrição<textarea value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Responsável<select value={owner} onChange={e=>setOwner(e.target.value)}>{c.data.technicians.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label>Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{cats.map(x=><option key={x}>{x}</option>)}</select></label><label>Data e horário do atendimento/abertura<input type="datetime-local" required value={occurredAt} onChange={e=>setOccurredAt(e.target.value)}/></label>{type==='long'?<><label>Prazo opcional<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label><label>Status inicial<select value={initialStatus} onChange={e=>setInitialStatus(e.target.value as Ticket['status'])}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label><label>Prioridade<select value={priority} onChange={e=>setPriority(e.target.value as Ticket['priority'])}><option>Baixa</option><option>Média</option><option>Alta</option></select></label></>:<><label>Funcionário atendido<input value={employee} onChange={e=>setEmployee(e.target.value)}/></label><label>Duração (minutos)<input type="number" min="0" value={duration} onChange={e=>setDuration(e.target.value)}/></label></>}<label className="full">Solução {type==='quick'||initialStatus==='Concluído'?'*':''}<textarea required={type==='quick'||initialStatus==='Concluído'} value={solution} onChange={e=>setSolution(e.target.value)}/></label><fieldset className="full"><legend>Participantes adicionais</legend>{c.data.technicians.filter(t=>t.id!==owner).map(t=><label key={t.id} className="check"><input type="checkbox" checked={participants.includes(t.id)} onChange={e=>setParticipants(e.target.checked?[...participants,t.id]:participants.filter(x=>x!==t.id))}/>{t.name}</label>)}<small>A participação efetiva será registrada no chamado.</small></fieldset></div><button className="button primary">Salvar chamado</button></form></>}
export default function App(){const [data,setData]=useState<Data>(()=>repository.read());const [active,setActive]=useState(data.technicians[0].id);useEffect(()=>repository.save(data),[data]);return <BrowserRouter><Layout c={{data,save:setData,active,setActive}}/></BrowserRouter>}





















