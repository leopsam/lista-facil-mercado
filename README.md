# Lista Fácil Mercado

Lista de compras mensal, responsiva e compartilhada, com cálculo automático e histórico de compras.

## Funcionalidades

- criação de uma compra por vez;
- produtos com quantidade, unidade e valor unitário;
- cálculo automático do total por produto e da compra;
- edição, exclusão e marcação de produto como pego;
- histórico das compras finalizadas;
- atualização automática a cada 2,5 segundos;
- modo local para testar a interface sem configurar banco;
- persistência compartilhada em PostgreSQL/Neon.

## Tecnologias

- Next.js 16 e TypeScript;
- React 19;
- Styled Components;
- PostgreSQL na Neon;
- preparado para publicação na Vercel.

## Rodar localmente

```bash
git clone git@github.com:leopsam/lista-facil-mercado.git
cd lista-facil-mercado
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. Com `NEXT_PUBLIC_USE_DATABASE=false`, as informações ficam no armazenamento do próprio navegador.

## Configurar a Neon

1. Crie um banco PostgreSQL na Neon.
2. Abra o editor SQL da Neon e execute o arquivo `database/schema.sql`.
3. Copie `.env.example` para `.env.local`.
4. Preencha `DATABASE_URL` com a conexão da Neon.
5. Altere `NEXT_PUBLIC_USE_DATABASE=true`.
6. Reinicie o servidor de desenvolvimento.

Com o banco habilitado, dois celulares acessando a mesma publicação consultam a mesma compra. A tela busca alterações automaticamente a cada 2,5 segundos e também atualiza logo após qualquer ação.

## Publicar na Vercel

Importe este repositório na Vercel e cadastre estas variáveis de ambiente:

```env
DATABASE_URL=sua-string-de-conexao-neon
NEXT_PUBLIC_USE_DATABASE=true
```

Depois, faça uma nova implantação.
