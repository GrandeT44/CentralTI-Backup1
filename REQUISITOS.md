# Projeto: Central TI — Lanobrasil

Você será o desenvolvedor principal de uma aplicação web interna de gestão de atividades e chamados de TI.

Quero que implemente a primeira versão funcional do projeto, não apenas um protótipo estático. Leia todos os requisitos abaixo antes de começar.

## 1. Objetivo

Desenvolver uma plataforma web para a equipe de TI da Lanobrasil registrar atendimentos realizados, acompanhar projetos prolongados, colaborar em chamados, planejar atividades diárias e semanais e construir uma base de conhecimento técnico.

O sistema também deverá fornecer informações gerenciais, sem estimular competição entre funcionários.

O sistema será desenvolvido inteiramente por nós, hospedado em contêineres Docker e sem dependências de serviços externos em tempo de execução.

## 2. Tecnologias

- React + TypeScript, utilizando Vite.
- Tailwind CSS para estilização.
- React Router para navegação.
- Lucide React para ícones.
- Recharts para gráficos.
- Docker e Docker Compose.
- Preparar a arquitetura para uma futura API Node.js/Fastify e PostgreSQL, mas NÃO implementá-los nesta etapa.

Não utilizar Firebase, Supabase, serviços de autenticação externos, CDNs em tempo de execução ou APIs de terceiros.

Utilizar dependências open source instaladas localmente pelo gerenciador de pacotes.

Se o diretório já contiver código, inspecione sua estrutura antes de realizar alterações. Não sobrescreva trabalho existente desnecessariamente.

## 3. Identidade visual

Quero uma interface moderna, elegante, amigável e intuitiva.

Diretrizes:

- Estilo visual próximo de plataformas modernas de produtividade, como Linear e GitHub, mas sem copiar suas interfaces.
- Sidebar lateral com navegação.
- Componentes com cantos arredondados e espaçamentos consistentes.
- Preferência inicial por tema escuro.
- Verde para atividades concluídas.
- Amarelo para contribuições e avisos.
- Azul para elementos informativos e atividades em andamento.
- Evitar dashboards com excesso de cartões numéricos.
- Priorizar infográficos, barras, gráficos e visualizações.
- Interface em português brasileiro.
- Responsividade para desktop, tablet e celular.
- Estados vazios, mensagens de erro e feedback visual.

Criar uma identidade visual consistente e reutilizável.

## 4. Módulos do aplicativo

### 4.1 Dashboard

A página inicial deverá apresentar:

- Resumo visual dos chamados abertos, em andamento, pendentes e concluídos.
- Indicadores de chamados atrasados.
- Gráficos de evolução semanal e mensal.
- Distribuição de atendimentos por categoria.
- Atividades recentes.
- Próximas tarefas planejadas.
- Visão resumida da carga de trabalho da equipe.

Priorizar representações visuais em vez de excesso de números.

### 4.2 Gerenciamento de chamados

Implementar dois tipos de registro.

**Atendimento rápido**

O técnico resolve primeiro e registra depois.

Campos:

- Título.
- Descrição opcional.
- Funcionário atendido.
- Técnico responsável.
- Categoria.
- Data e horário do atendimento.
- Duração efetiva, quando conhecida.
- Solução aplicada.
- Participantes adicionais, quando houver.

O atendimento rápido poderá ser criado diretamente como concluído.

**Atividade prolongada**

Utilizada para projetos ou problemas que podem durar dias ou semanas.

Campos:

- Título.
- Descrição detalhada.
- Responsável principal.
- Participantes.
- Categoria.
- Prioridade.
- Data de abertura.
- Prazo opcional.
- Status.
- Histórico de progresso.
- Solução e conclusão.

Status sugeridos:

- Aberto.
- Em andamento.
- Aguardando terceiros.
- Concluído.
- Cancelado.

O sistema deverá calcular o atraso a partir do prazo e do estado do chamado. Chamados sem prazo não devem ser classificados automaticamente como atrasados.

Cada chamado prolongado terá uma linha do tempo com registros cronológicos de atualizações.

Alterações de estado, prazo e responsável devem aparecer no histórico. Atualizações de progresso serão criadas manualmente.

### 4.3 Colaboração entre técnicos

Um chamado poderá ter um responsável principal e múltiplos colaboradores.

Quando um chamado compartilhado for concluído:

- Contabilizar apenas um chamado concluído no total geral.
- Atribuir a responsabilidade principal ao técnico responsável.
- Reconhecer uma contribuição para cada técnico que efetivamente participou.
- Não gerar ranking competitivo.
- Não conceder contribuições duplicadas ao mesmo técnico no mesmo chamado.
- Não confundir associação ao chamado com participação efetiva: deve existir um registro de trabalho ou contribuição.

Exibir as contribuições nos perfis individuais.

### 4.4 Perfil do técnico

Cada técnico terá uma página de perfil contendo:

- Nome.
- Foto ou avatar.
- Chamados ativos.
- Atividades concluídas recentemente.
- Participações em chamados de outros técnicos.
- Planejamento diário e semanal.
- Barra do dia.
- Calendar Heatmap.

Não adicionar gamificação competitiva.

### 4.5 Barra do dia

Desenvolver uma visualização temporal das atividades do técnico.

Requisitos:

- Visualizar o dia selecionado por horários.
- Criar blocos de trabalho planejado vinculados aos chamados.
- Registrar atendimentos imprevistos.
- Permitir blocos planejados que se sobreponham.
- Diferenciar visualmente planejamento e trabalho efetivamente realizado.
- Permitir editar e excluir blocos de planejamento.
- Permitir navegar entre dias.
- Permitir criar planejamentos para a semana.
- Preservar os dias anteriores: ao mudar a data, a barra exibida muda, mas os registros históricos não são apagados.
- Não exigir planejamento diário obrigatório.
- Permitir registrar atendimentos retroativamente.

Os blocos devem representar visualmente a duração e os horários.

Exemplo:

08:00–16:30: Desenvolvimento de sistema interno (planejado).

09:10–12:00: Conserto de computador (imprevisto).

As atividades poderão se sobrepor no planejamento.

Separar os intervalos planejados dos intervalos efetivamente trabalhados. Não contabilizar duas vezes o mesmo intervalo de trabalho real para um técnico.

### 4.6 Calendar Heatmap

Criar um componente React reutilizável chamado `ActivityHeatmap`.

Inspirar-se no calendário de contribuições do GitHub.

Requisitos:

- Calendário anual com semanas organizadas em colunas e dias da semana em linhas.
- Exibir os meses na parte superior.
- Considerar corretamente anos bissextos, semanas parciais e o calendário real.
- Dias sem registros na cor cinza-escuro.
- Atendimentos concluídos como responsável principal em diferentes intensidades de verde.
- Contribuições em chamados de outros técnicos em amarelo.
- Dias com ambos os tipos de atividade deverão ter uma representação combinada, preferencialmente uma célula dividida diagonalmente entre verde e amarelo.
- Tooltip com data, número de chamados concluídos e contribuições.
- Navegação entre anos.
- Layout responsivo, permitindo rolagem horizontal em dispositivos pequenos.
- Legenda das cores.
- Acessibilidade por teclado e rótulos descritivos.
- Atualização automática quando os dados mudarem.

O componente deve receber dados por propriedades, sem depender diretamente do localStorage ou de uma futura API.

Criar também uma indicação discreta de dias em que houve progresso documentado em atividades prolongadas, mesmo sem encerramentos.

Esses indicadores não devem ser tratados como pontuação de produtividade.

### 4.7 Base de conhecimento

Implementar uma primeira versão com:

- Listagem de artigos.
- Pesquisa textual.
- Categorias.
- Visualização detalhada.
- Título do problema.
- Sintomas.
- Procedimentos realizados.
- Soluções comprovadas.
- Chamados relacionados.

Permitir cadastrar um artigo e registrar múltiplas soluções para um mesmo problema.

Preparar a interface para, futuramente, transformar a solução de um chamado encerrado em artigo ou associá-la a um artigo existente.

### 4.8 Relatórios

Criar uma área de relatórios com:

- Filtros por período.
- Filtro por técnico.
- Relatório geral da equipe.
- Relatório individual.
- Chamados abertos e encerrados.
- Chamados atrasados.
- Distribuição por categoria.
- Participações em chamados.
- Tempo efetivamente registrado.
- Evolução semanal e mensal.

Evitar dupla contagem de chamados compartilhados.

Permitir exportação inicial dos dados em CSV. Preparar a estrutura para exportações futuras em PDF e Excel.

## 5. Modelagem e dados de demonstração

Ainda não implementar banco de dados nem backend.

Criar interfaces TypeScript para:

- Technician
- Ticket
- TicketParticipant
- TicketProgressEntry
- WorkSession
- PlannedActivity
- KnowledgeArticle
- KnowledgeSolution
- ActivityHeatmapDay

Separar os modelos de domínio dos componentes visuais.

Criar uma camada de serviços/repositórios com contratos claros para operações de leitura, criação e atualização.

Implementar inicialmente um repositório local de demonstração.

Utilizar dados fictícios coerentes de vários técnicos, chamados rápidos, projetos prolongados, contribuições e artigos.

Persistir os dados de demonstração no localStorage com versionamento simples, permitindo que alterações sobrevivam ao recarregamento da página.

O localStorage será temporário: não criar uma arquitetura que obrigue os componentes a acessá-lo diretamente.

Mostrar claramente no sistema que se trata de um ambiente de demonstração, sem autenticação real e sem compartilhamento de dados entre navegadores.

Implementar um seletor de técnico ativo exclusivamente para testar os diferentes perfis.

## 6. Regras importantes

- Um chamado pode ter vários participantes, mas somente um responsável principal por vez.
- Um chamado concluído conta apenas uma vez no total da equipe.
- Registrar separadamente responsabilidade principal e contribuição.
- Uma contribuição deve representar trabalho efetivamente realizado.
- Um chamado sem prazo não fica atrasado automaticamente.
- Um registro de planejamento não equivale a tempo trabalhado.
- Atendimentos rápidos não exigem histórico detalhado de procedimentos.
- Atividades prolongadas permitem atualizações de progresso.
- Todas as datas devem funcionar corretamente no fuso horário America/Sao_Paulo.
- A navegação e os filtros devem funcionar com os dados de demonstração.
- O sistema deve permitir operações reais sobre os dados locais de demonstração, não apenas exibir telas estáticas.

## 7. Organização do código

Organizar o projeto por funcionalidades e responsabilidades.

Separar:

- Componentes compartilhados.
- Layouts.
- Páginas.
- Modelos TypeScript.
- Serviços e repositórios.
- Dados de demonstração.
- Utilitários de datas e métricas.
- Hooks personalizados.
- Estilos.

Criar componentes reutilizáveis e evitar arquivos excessivamente grandes.

Adicionar um `README.md` com instruções de instalação e execução.

Adicionar um `AGENTS.md` com as convenções de desenvolvimento e as regras essenciais deste projeto.

## 8. Docker

Criar:

- Dockerfile multi-stage para gerar o build React e servi-lo em ambiente de produção.
- `compose.yaml`.
- `.dockerignore`.
- Configuração de servidor web apropriada para rotas React.

Nesta primeira fase, apenas o frontend precisará ser executado pelo Docker.

Documentar os comandos necessários para executar localmente e com Docker Compose.

Não expor o servidor de desenvolvimento Vite como se fosse ambiente de produção.

## 9. Escopo da primeira entrega

Quero uma primeira versão navegável e funcional, priorizando:

1. Estrutura do projeto e design system.
2. Sidebar e navegação.
3. Dashboard com dados de demonstração.
4. Lista de chamados, filtros e criação de chamados.
5. Detalhes do chamado e linha do tempo.
6. Perfil individual do técnico.
7. Barra do dia com planejamento.
8. Calendar Heatmap.
9. Base de conhecimento básica.
10. Relatórios básicos.
11. Persistência local de demonstração.
12. Docker Compose.

Não implementar banco de dados, backend real ou autenticação nesta etapa.

## 10. Qualidade e entrega

Antes de finalizar:

- Verificar erros TypeScript.
- Executar o build de produção.
- Executar o lint.
- Criar testes para cálculos de atraso, créditos de contribuição, datas do heatmap e sobreposição de intervalos.
- Conferir funcionamento básico das rotas e formulários.
- Verificar responsividade.
- Não deixar botões decorativos que aparentem funcionar sem realizar uma ação. Caso uma funcionalidade seja futura, identificá-la como indisponível.
- Documentar funcionalidades concluídas e pendentes.

Comece inspecionando o repositório e planejando brevemente a estrutura.

Depois, implemente efetivamente a primeira versão.

Ao finalizar, apresente um resumo dos arquivos criados, funcionalidades disponíveis, comandos de execução, testes realizados e pendências para a próxima etapa.

Não substitua a implementação por uma descrição conceitual. Quero o aplicativo executável, mesmo que algumas funcionalidades inicialmente operem somente sobre dados de demonstração.