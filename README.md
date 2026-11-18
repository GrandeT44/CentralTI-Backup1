# Central TI — Lanobrasil

Aplicação local para chamados, planejamento, conhecimento e relatórios da equipe de TI.

## Executar

Requer **Node.js 26 ou superior**.

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite. O comando inicia o Vite e a API local. No PowerShell do Windows, também é possível iniciar com `node server/dev.mjs`; isso evita a pergunta do `npm.cmd` sobre finalizar o arquivo em lotes ao interromper com Ctrl+C.

Para produção:

```sh
npm run build
npm start
```

Abra `http://127.0.0.1:3001`. O banco SQLite fica em `local-data/central-ti.sqlite`. Use `npm run backup` para gerar uma cópia consistente na mesma pasta antes de operações importantes.

Para acessar pela rede no PowerShell:

```powershell
$env:HOST = '0.0.0.0'
$env:PORT = '8080'
npm.cmd start
```

Abra `http://IP-DO-COMPUTADOR:8080` nos demais computadores. Depois de atualizar o código, **reinicie o processo do servidor** para carregar as novas rotas da API.

## Primeiro acesso

Entre como **Administrador TI** com a senha de administrador previamente definida. No Perfil, em **Perfis da equipe**, gere um código para cada técnico existente. O técnico escolhe o próprio perfil na tela inicial, informa o código e cria sua senha de no mínimo 10 caracteres. O código é usado uma única vez. O administrador pode redefinir a senha de qualquer técnico; as sessões anteriores são encerradas. O perfil administrador não pode ser desativado.

## Onde ficam os dados

Perfis, senhas protegidas por hash, sessões, fotos e notas pessoais ficam no SQLite local. As notas são carregadas apenas após autenticação no perfil correspondente. Trocar de perfil encerra a sessão e exige a senha do próximo perfil.

Chamados, registros de trabalho, planejamentos, artigos e quadros Kanban também ficam no SQLite. O espaço compartilhado começa vazio em uma instalação nova. Todas as telas autenticadas usam o mesmo conjunto de dados; alterações feitas em outro computador aparecem em até alguns segundos. Alterações em registros diferentes são combinadas. Se um registro mudar no servidor entre a leitura e a gravação, a gravação antiga é recusada para evitar sobrescrever o trabalho de outra pessoa. Mantenha a página aberta enquanto houver um aviso de envio pendente. O aplicativo não usa o armazenamento do navegador para persistir dados.

## Docker Compose

```sh
docker compose up --build
```

Abra `http://localhost:8080`. O volume `central_ti_data` mantém o banco entre recriações do contêiner. A porta fica acessível somente no próprio computador por padrão.

## Verificação

```sh
npm run build
npm run lint
npm test
```
