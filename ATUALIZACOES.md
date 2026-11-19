# Atualizações do programa

## 16/11/2026

- O arquivo `REQUISITOS.md` foi preenchido após a primeira leitura; os requisitos foram revisados.
- Criada a primeira versão navegável da Central TI com dados de demonstração persistidos no navegador.
- Implementados chamados, progresso, colaboração, planejamento, heatmap, conhecimento e relatórios com exportação CSV.
- Preparada a execução de produção com Docker Compose e Nginx.
- Build, lint e quatro testes dos cálculos centrais executados com sucesso. As pendências funcionais estão no `README.md`.
- Concluídos edição de planejamentos, repetição semanal, registro retroativo e barra temporal proporcional aos horários.
- Acrescentados múltiplas soluções por artigo, evolução semanal e mensal, relatórios individuais e datas históricas em São Paulo.
- O formulário de atendimento rápido passou a registrar duração efetiva; o heatmap foi extraído como componente reutilizável.
- Build, lint e seis testes passaram. As rotas principais responderam no preview de produção. Docker não estava instalado neste ambiente para iniciar o Compose.
- Substituída a sidebar por cabeçalho responsivo com navegação, seletor de técnico e indicação do ambiente de demonstração.
- Dashboard redesenhado com foco no dia, chamados que exigem atenção, andamento, prazos, distribuição, evolução recente, equipe e agenda pessoal. Os indicadores usam os dados locais existentes.
- Criada uma camada de estilos compartilhados para tipografia, superfícies, campos e ações, preservando os fluxos dos demais módulos. Build, lint e seis testes passaram.
- Perfil redesenhado como área pessoal, com atividade recente, atuação, contribuições em destaque e heatmap anual mais legível.
- Adicionado Kanban pessoal ligado aos chamados, com colunas padrão, colunas personalizadas, reordenação, movimento de cards e persistência local; mudanças nas colunas padrão atualizam o status do chamado.
- Destacadas contribuições no Perfil, Dashboard, detalhe do chamado e relatórios; o heatmap passou a diferenciar progresso manual de mudanças automáticas. Build, lint e dez testes passaram.
- Página Chamados redesenhada com listagem compacta responsiva, pesquisa ampliada, filtros combináveis, agrupamento recolhível, ordenação e paginação.
- Adicionadas ações de responsável, prioridade, status e conclusão na lista, com histórico e sincronização imediata com Perfil, Kanban e relatórios. O fluxo de atendimento rápido concluído ganhou acesso direto.
- Build, lint e treze testes passaram após o redesenho.

## 17/11/2026

- Reformulada a página de detalhes do chamado como área de trabalho: propriedades compactas, histórico cronológico, atualizações por tipo, registro de tempo e confirmação de conclusão.
- Ajustada a listagem para linhas mais enxutas e alinhadas, mantendo pesquisa, filtros e ações existentes.
- Restringida a administração de chamados ao criador e aos colaboradores associados; a troca de responsável ficou exclusiva do criador. Trabalho registrado continua sendo necessário para gerar contribuição.
- Adicionado envio de foto ao próprio perfil, com recorte local e exibição nos avatares do aplicativo.
- Centralizadas as regras de acesso e registro de trabalho; build, lint e 19 testes passaram.
- Substituída a página de criação por um seletor global e dois modais: atendimento rápido com título único e cronômetro opcional, e atividade prolongada com propriedades, participantes e etapas.
- Preservada a página de origem após salvar; adicionadas ações de confirmação e registro em sequência. O detalhe permite complementar atendimentos rápidos, editar descrição, acompanhar etapas e converter um atendimento em atividade prolongada.
- Ajustado o Kanban para colocar chamados abertos em **A fazer**; 24 testes, build e lint passaram. Modais inspecionados em larguras de desktop e celular.
- Corrigido o layout das etapas no modal de atividade prolongada e na checklist do detalhe: checkbox com tamanho fixo, campo de nome flexível e ações alinhadas. Ajustada a largura do modal em telas estreitas; visual conferido com etapas reais em desktop e 390 px.
- Unificada a descrição do chamado em um painel de leitura e edição, com formatação contextual para título, negrito, itálico, sublinhado, listas, código e links. Textos sem espaços agora quebram dentro da coluna; removida a seção duplicada e corrigido um estilo da listagem que ocultava a descrição no celular.
- Redesenhada a checklist no detalhe dos chamados com progresso legível, etapas em linhas próprias, estado visual de conclusão e ações discretas; mantidos renomear, reordenar, excluir, adicionar e marcar etapas.
- Responsáveis deixaram de ser contados como participantes, inclusive em registros antigos; a criação de chamados não os duplica na lista. O criador agora pode elevar um participante a responsável diretamente no detalhe, com ícone próprio e indicador de contribuição afastado da barra de rolagem.
- Ampliado o crédito de contribuição para atualizações que o autor confirma como trabalho realizado e para etapas concluídas pelo próprio executor. Registros administrativos e etapas sem executor não geram crédito; cada técnico recebe no máximo um crédito por chamado concluído.
- Avisos de ações nos chamados passaram a usar o mesmo cartão do registro rápido, fixo no canto inferior direito, com mensagem contextual, fechamento manual e desaparecimento automático após seis segundos.
- Planejamento redesenhado com o Kanban pessoal antes exibido no Perfil, blocos de ideia em “A fazer”, conversão desses blocos pelo formulário de chamados e modo compacto salvo por técnico.
- Adicionado bloco de notas pessoal com salvamento local automático. A barra horizontal do dia foi removida; planos e trabalho registrado permanecem disponíveis em uma agenda em lista e nos formulários existentes.
- A página Planejamento foi simplificada conforme revisão: bloco de notas movido para o topo e removidas as seções de atividades do dia, planejar atividade e registrar trabalho. Os registros já salvos foram preservados.
- Adicionado perfil permanente de administrador, desbloqueado por senha na troca de técnico, com edição de qualquer chamado e troca de responsável. O Perfil do administrador ganhou criação, exclusão e desativação de técnicos; perfis com histórico são preservados como desativados.

## 18/11/2026

- Criado banco SQLite local para perfis, senhas, sessões, fotos e notas pessoais; acesso às notas passou a exigir autenticação no perfil correspondente.
- Técnicos criam a senha no primeiro acesso com código único emitido pelo administrador. O administrador pode redefinir senhas, criar e desativar perfis, além de importar perfis e notas antigos do navegador.
- A aplicação local e o contêiner agora incluem API própria e armazenamento persistente. Build, lint e 33 testes passaram, incluindo persistência das notas após reinício e isolamento entre perfis.
- Corrigido o login no modo de desenvolvimento: a API usa uma porta local livre e o Vite encaminha as requisições para essa instância; a origem local do Vite é aceita sem abrir a validação do servidor de produção.
- Tornado o encerramento da API e do SQLite seguro contra chamadas repetidas; verificados interrupção, reinício e resposta da API após reiniciar. Build, lint e 35 testes passaram.
- A tela de entrada passou a tentar reconectar quando a API ainda está iniciando e orienta a abrir o endereço atual do Vite. Corrigida a escolha inicial do perfil após a lista carregar. Confirmado que a instância nova em `localhost:5174` responde, enquanto a instância antiga em `localhost:5173` usa uma API indisponível.
- Substituídas as chamadas diretas a `crypto.randomUUID()` por uma geração de IDs compatível com acesso HTTP pelo IP da rede. A correção abrange criação e conclusão de chamados, etapas, atualizações, participantes, registros de trabalho, Kanban e conhecimento. O servidor da rede entregou o build atualizado; build, lint e 37 testes passaram.
- Movidos chamados, sessões de trabalho, planejamentos, artigos e quadros Kanban para dados compartilhados no SQLite. As telas atualizam os registros de outros computadores periodicamente; alterações em registros distintos são combinadas e conflitos no mesmo registro são recusados.
- Adicionada migração inicial pelo navegador com o histórico principal, importação complementar de outros navegadores e arquivos JSON, com cópias de importações conflitantes preservadas no banco. Novos chamados recebem IDs únicos também quando criados ao mesmo tempo em computadores diferentes.
- Importações de chamados com o mesmo número antigo agora recebem IDs distintos e atualizam as referências de trabalho, planejamento, artigos e Kanban. Criado `npm run backup` e gerada uma cópia do banco existente antes da migração.
- A pedido da equipe, encerrada a fase de testes: removidas as cópias e a migração pelo navegador, assim como os fluxos de importação antigos. Novas instalações começam com dados de trabalho vazios no SQLite; perfis e autenticação permanecem.
- Limpo o banco compartilhado desta instalação: 7 chamados, 3 registros de trabalho e 1 artigo de teste foram removidos, assim como notas e fotos de teste. Os perfis e suas senhas foram mantidos para permitir o acesso.
- Reformulada a base de Conhecimento com busca por conteúdo, filtro de categoria, lista legível, estados vazios e artigo em seções. Criar e editar artigos agora abre um formulário sobre a tela, sem interromper a navegação.
- O detalhe de cada chamado recomenda até três artigos pela coincidência de termos no título e na descrição, com prioridade para artigos vinculados ao chamado. A regra funciona localmente sobre os artigos compartilhados; build, lint e 42 testes passaram.
- A Base de Conhecimento evoluiu para biblioteca técnica: busca por conteúdo e etiquetas, categorias com contagens, ordenação por atualização ou título e leitura com Markdown seguro e cópia de comandos.
- O formulário em modal foi substituído por editor em página própria, com soluções independentes, contexto, confirmação explícita, vínculo pesquisável de chamados, metadados opcionais de autoria e histórico de alterações. Artigos antigos continuam compatíveis. Build, lint e 44 testes passaram.
- Alinhado o visual da biblioteca de Conhecimento ao Início e a Chamados: título no mesmo formato, entrada suave, cores e superfícies coerentes, categorias com ícones e linhas de artigos mais compactas. Criadas classes compartilhadas para cabeçalhos e animação das próximas páginas.
- Guias de Conhecimento ganharam apresentação comunitária com foto e nome do criador, favoritos pessoais persistidos no SQLite e pedidos de edição para outros técnicos. Só o criador ou administrador pode aprovar; cada pedido aprovado aplica a proposta uma vez e gera um crédito de contribuição ao proponente, visível também no Perfil. Testados acesso, aprovação, recusa, isolamento de favoritos e persistência após reinício; build, lint e 46 testes passaram.
- Na aba Conhecimento, avisos de guias e sugestões passaram a usar o mesmo cartão temporário dos chamados. Pedidos de edição foram organizados na coluna lateral, com lista expansível e revisão em janela sobreposta.
- O editor de guias agora reúne todo o texto em um campo com ferramentas de formatação e permite anexar imagens ao próprio artigo. Conteúdo, fotos e propostas aprovadas ficam vinculados ao guia no SQLite; testadas persistência, aprovação e recusa.

## 19/11/2026

- No detalhe dos chamados, as recomendações da Base de Conhecimento foram movidas para depois dos dados e etapas da atividade. O painel passou a ter linhas compactas, motivo da recomendação em cada artigo e acesso direto à base.
- Alinhada a coluna de autores e favoritos na lista de guias da Base de Conhecimento. Nomes longos agora são abreviados visualmente dentro de uma largura fixa, sem deslocar os controles entre as linhas.
- A exclusão de técnicos agora revoga o acesso e limpa senha, foto e notas, preservando apenas a identidade necessária ao histórico. Ana, Bruno e Carla não reaparecem após reiniciar o banco; o Administrador TI permanece permanente.
- Artigos cujo responsável foi excluído exibem aviso na biblioteca e no detalhe. Técnicos podem solicitar a responsabilidade de artigos órfãos e chamados abertos sem responsável; o administrador recebe uma fila para aprovar ou recusar.
- Chamados abertos passam automaticamente ao primeiro participante ativo quando o responsável é excluído. Chamados concluídos mantêm o responsável histórico para preservar a contabilização de conclusões.
- Quando uma reclamação de artigo é aprovada, a biblioteca e o detalhe mostram o novo responsável, mantendo o criador original identificado. Sugestões de edição pendentes de um artigo que ficou órfão são encerradas para evitar aprovações com uma versão de propriedade antiga.
- A lista de perfis ativos agora é atualizada periodicamente nos outros computadores; uma sessão excluída perde o acesso e a tela de entrada remove o perfil da lista.
- Pedidos recusados voltam a permitir uma nova solicitação sem precisar recarregar a página.
- Relatórios redesenhados com o mesmo cabeçalho, superfícies, cores e entrada suave das páginas Início, Chamados e Conhecimento. A análise separa aberturas e conclusões do período das pendências atuais, além de mostrar prazos vencidos, categorias, trabalho efetivo e distribuição por técnico.
- Adicionada exportação direta de PDF plano para um técnico ou para a equipe. O documento da equipe inclui visão geral e uma página para cada perfil ativo; cada página individual reúne foto, indicadores do Perfil, atividade recente, chamados em foco, contribuições e calendário anual. A exportação CSV de chamados foi mantida.
- Relatórios agora comparam semana e mês atuais aos anteriores em aberturas, conclusões e contribuições, com cores próprias. Aprovações de edição em guias entram na data da aprovação. O PDF ganhou uma página de comparação e um gráfico de ondas com as três séries, inclusive na exportação da equipe.
- O administrador e o responsável atual de um artigo agora podem excluí-lo pelo detalhe, após confirmação. A API valida a permissão e evita apagar uma versão alterada em outro computador; favoritos e pedidos pendentes ligados ao artigo são removidos, enquanto créditos de contribuições já aprovadas permanecem no histórico.
- Na biblioteca, o responsável do guia passou para baixo da identificação do criador. Novos títulos têm limite de 100 caracteres validado no editor e no servidor; títulos antigos muito longos quebram ou são limitados visualmente para não ultrapassar os cards e o cabeçalho.
- Os avisos do canto direito agora compartilham uma área de empilhamento, desaparecem gradualmente após cinco segundos e os avisos de guia salvo ou excluído não reaparecem após atualizar a página.
