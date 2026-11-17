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
