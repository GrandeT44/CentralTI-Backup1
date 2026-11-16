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

Os dados de demonstração ficam no `localStorage` deste navegador, na chave `lanobrasil-ti-v1`. Não há autenticação, sincronização entre navegadores, banco de dados ou backend. O seletor de técnico serve somente à demonstração. O repositório em `src/repository.ts` pode ser trocado por uma API futuramente.

Disponível: painel com evolução semanal e mensal, criação e acompanhamento de chamados, registro de progresso e trabalho efetivo, planejamento diário e repetição por cinco dias, edição e exclusão de blocos planejados, registro retroativo, heatmap anual, artigos com múltiplas soluções e chamados relacionados, relatórios gerais e individuais e exportação CSV.

O formulário de atendimento rápido aceita data e horário anteriores. Quando a duração é informada, um intervalo de trabalho efetivo é criado para o responsável. O planejamento não entra no cálculo de tempo efetivo. Em relatórios de equipe, os intervalos são unidos separadamente por técnico.

Nesta fase não há autenticação, API, banco de dados, PDF ou Excel. A aplicação está estruturada para que o repositório local seja substituído por uma API Node.js/Fastify e PostgreSQL posteriormente. O build Docker foi preparado, mas precisa ser executado em um ambiente com Docker instalado.
