import type { Data, Ticket } from './domain'
const iso = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString() }
const ticket = (id: string, title: string, ownerId: string, status: Ticket['status'], category: string, days: number, extra: Partial<Ticket> = {}): Ticket => ({ id, title, ownerId, status, category, type: 'long', priority: 'Média', description: `Acompanhamento de ${title.toLowerCase()}.`, openedAt: iso(days), participants: [], progress: [], ...extra })
export const seed: Data = {
 technicians: [{id:'ana',name:'Ana Martins',role:'Infraestrutura',avatar:'AM'},{id:'bruno',name:'Bruno Costa',role:'Suporte',avatar:'BC'},{id:'carla',name:'Carla Souza',role:'Sistemas',avatar:'CS'}],
 tickets: [
  ticket('TI-1042','Atualização dos computadores do financeiro','ana','Em andamento','Hardware',-5,{dueAt:iso(3),priority:'Alta',participants:[{technicianId:'bruno',worked:true}],progress:[{id:'p1',at:iso(-2),authorId:'bruno',text:'Inventário das máquinas concluído.'}]}),
  ticket('TI-1041','Integração do sistema de estoque','carla','Aguardando terceiros','Sistemas',-12,{dueAt:iso(-1),progress:[{id:'p2',at:iso(-4),authorId:'carla',text:'Solicitado acesso à equipe externa.'}]}),
  ticket('TI-1040','Configuração de impressora','bruno','Concluído','Periféricos',-3,{type:'quick',employee:'Mariana Lima',solution:'Driver reinstalado e teste de impressão realizado.',completedAt:iso(-3),durationMinutes:35}),
  ticket('TI-1039','Revisão da rede sem fio','ana','Concluído','Rede',-9,{completedAt:iso(-2),solution:'Pontos de acesso reconfigurados.',participants:[{technicianId:'carla',worked:true}]}),
  ticket('TI-1038','Acesso ao e-mail corporativo','bruno','Aberto','Acessos',-1,{dueAt:iso(2),employee:'Rafael Melo'}),
  ticket('TI-1037','Backup das estações de trabalho','carla','Em andamento','Segurança',-6,{dueAt:iso(5)})
 ],
 sessions: [{id:'w1',technicianId:'ana',ticketId:'TI-1042',start:iso(-2),end:new Date(new Date(iso(-2)).getTime()+7200000).toISOString()},{id:'w2',technicianId:'bruno',ticketId:'TI-1042',start:iso(-2),end:new Date(new Date(iso(-2)).getTime()+3600000).toISOString()},{id:'w3',technicianId:'carla',ticketId:'TI-1039',start:iso(-3),end:new Date(new Date(iso(-3)).getTime()+5400000).toISOString()}],
 plans: [],
 articles: [{id:'kb1',title:'Impressora não responde após atualização',category:'Periféricos',symptoms:'Fila de impressão travada e dispositivo offline.',procedures:'Verificar conexão, limpar fila e reinstalar driver.',solutions:[{id:'s1',text:'Reinstalar o driver homologado e reiniciar o spooler.'},{id:'s2',text:'Se persistir, revisar o endereço IP reservado.'}],ticketIds:['TI-1040']}]
}
