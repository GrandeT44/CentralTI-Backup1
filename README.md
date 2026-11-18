# Central TI — Lanobrasil

Aplicação de demonstração para gestão de chamados, planejamento, conhecimento e relatórios da equipe de TI.

## Executar localmente

```sh
npm install
npm run dev
```

Acesse o endereço informado pelo Vite. Para build: `npm run build`. Para lint: `npm run lint`. Para os testes dos cálculos centrais: `npm test` (validado com Node.js 26).

## Docker Compose

```sh
docker compose up --build
```

Acesse `http://localhost:8080`. O contêiner serve o build de produção com Nginx e fallback para as rotas React.

## Dados e limitações

Os dados de demonstração ficam no `localStorage` deste navegador, na chave `lanobrasil-ti-v1`. O perfil permanente de administrador exige senha para ser selecionado e pode editar qualquer chamado, criar técnicos e excluir perfis sem histórico; perfis com histórico são desativados para preservar os registros. Essa senha é verificada localmente e a sessão dura até sair do perfil ou recarregar a página. Não há autenticação de servidor, sincronização entre navegadores, banco de dados ou backend: quem controla o navegador ainda pode alterar o armazenamento e o código local. O repositório em `src/repository.ts` pode ser trocado por uma API futuramente.

Disponível: painel com evolução semanal e mensal, criação e acompanhamento de chamados, registro de progresso e trabalho efetivo, Kanban pessoal, blocos de ideia, notas por técnico, registro de trabalho nos chamados, heatmap anual, artigos com múltiplas soluções e chamados relacionados, relatórios gerais e individuais e exportação CSV.

O layout usa navegação no cabeçalho. O Dashboard permite alternar entre visão da equipe e chamados ligados ao técnico ativo; os cards de chamados abrem seus detalhes. As demais telas mantêm seus fluxos atuais enquanto o redesenho visual é aprovado por etapas.

O Perfil funciona como área pessoal: reúne atuação, atividade recente, contribuições e heatmap anual. O técnico ativo pode carregar uma foto para o próprio perfil; a imagem é processada no navegador e salva junto aos dados locais. O quadro foi movido para Planejamento. Ele usa os chamados existentes e permite criar blocos pessoais em **A fazer**, que podem virar chamados pelo formulário existente. O modo compacto e as notas pessoais são salvos por técnico. A página de Planejamento agora exibe apenas notas pessoais e o Kanban. Os registros antigos de planos e trabalho permanecem no armazenamento local; novos registros de tempo são feitos nos chamados. Colunas personalizadas e posições são salvas no mesmo repositório local. Ao mover um chamado entre as colunas padrão, seu status é atualizado e a mudança entra no histórico.

A página Chamados oferece filtros rápidos e avançados combináveis, busca por título, número, descrição e funcionário atendido, ordenação, agrupamento recolhível e paginação. A lista usa linhas compactas alinhadas. O detalhe reúne descrição, atualizações, timeline, propriedades, colaboradores, tempo registrado e confirmação de conclusão. Criador e colaboradores associados podem administrar o chamado; somente o criador pode trocar o responsável e convidar colaboradores. O botão **Concluir** abre a confirmação no detalhe. O responsável principal é reconhecido uma vez; cada colaborador pode receber uma contribuição por chamado concluído ao registrar tempo, publicar atualização confirmada como trabalho realizado ou concluir uma etapa como executor. A ação **Registrar atendimento concluído** abre diretamente o formulário de chamado rápido.

A criação ocorre em modais sobre a tela atual. O atendimento rápido exige apenas título; o cronômetro opcional desconta pausas e cria uma sessão de trabalho somente ao salvar. Dados como descrição, funcionário, solução, data retroativa e duração podem ser completados depois no detalhe. A atividade prolongada aceita descrição em Markdown, responsável, prioridade, prazo, participantes e checklist; a solução é registrada posteriormente. O planejamento não entra no cálculo de tempo efetivo. Em relatórios de equipe, os intervalos são unidos separadamente por técnico.

As restrições de edição usam o técnico ativo selecionado na interface de demonstração; sem autenticação de servidor, elas não são uma barreira de segurança contra alterações manuais no armazenamento local. Nesta fase não há API, banco de dados, PDF ou Excel. A aplicação está estruturada para que o repositório local seja substituído por uma API posteriormente. O build Docker foi preparado, mas precisa ser executado em um ambiente com Docker instalado.
