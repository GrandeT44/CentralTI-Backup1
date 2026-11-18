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
