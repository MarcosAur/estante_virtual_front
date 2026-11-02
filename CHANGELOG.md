# Frontend Changelog - SPA Estante Virtual

Todas as alterações notáveis na interface e cliente Vue 3 estão documentadas neste arquivo.

---

## [1.1.0] - 2026-10-31

### 🐛 Correções de Bugs (Bugfix)

- **Correção no Carregamento de Capas e Pôsteres Protegidos:**
  - **Problema:** Tags `<img>` nativas não enviam cabeçalhos HTTP customizados (`Authorization: Bearer <token>`). As rotas de capas de livros e pôsteres exigem autenticação do Sanctum, resultando em erro `401 Unauthorized` e imagem quebrada.
  - **Solução:** Criado o componente reutilizável `src/components/AuthImage.vue`, que intercepta a URL, realiza a requisição autenticada via Axios com `responseType: 'blob'`, cria um `Object URL` seguro e gerencia seu ciclo de vida com revogação de memória no unmount.
  - Aplicado em `BookCard.vue`, `BookDetailView.vue`, `BookFormView.vue`, `MovieCard.vue`, `MovieDetailView.vue` e `MovieFormView.vue`.

---

### 🚀 Novas Funcionalidades (Cineclube & Avaliação de Filmes)

- **Tipagem TypeScript (`src/types/index.ts`):**
  - Adicionado enum de status `MovieStatus` (`want_to_watch` | `watching` | `watched`).
  - Adicionadas interfaces `Movie`, `MovieReview` e `ExternalMovieLookup`.
  - Estendida a interface `Stats` com métricas consolidadas de filmes e notas.

- **Camada de Serviços & APIs:**
  - `src/api/movies.ts`: comunicação com os novos endpoints REST de filmes (CRUD, filtros, status, upload/remoção de pôsteres e busca externa no TMDB).
  - `src/api/movieReviews.ts`: gerenciamento de resenhas privadas de filmes (leitura, upsert e exclusão).

- **Gerenciamento de Estado (Pinia):**
  - `src/stores/movies.ts`: store dedicada para filmes com estado reativo (`movies`, `currentMovie`, `loading`, `meta`) e métodos de manipulação.
  - Integrado o reset da store no fluxo de logout (`Navbar.vue`).

- **Novos Componentes:**
  - `src/components/MovieCard.vue`: cartão visual para filmes com renderização de pôster via `AuthImage`, placeholder dinâmico, badge de status, avaliação por estrelas, duração formatada e chips de tags.
  - `src/components/ShelfTabs.vue`: refatorado para aceitar abas customizadas por props, mantendo retrocompatibilidade com livros e suportando as abas de filmes (*Todos*, *Assistindo*, *Quero assistir*, *Assistidos*).

- **Novas Telas (Views):**
  - `src/views/MovieShelfView.vue` (`/filmes`): estante do cineclube com abas dinâmicas, contadores em tempo real sincronizados com a API, campo de busca com debounce, filtros por tags pessoais e seletor de ordenação.
  - `src/views/MovieDetailView.vue` (`/filmes/:id`): visão detalhada do filme, metadados (ano, duração, gênero, sinopse, tags), controle rápido de status e formulário/exibição de resenhas privadas com controle de spoiler.
  - `src/views/MovieFormView.vue` (`/filmes/novo` e `/filmes/:id/editar`): cadastro/edição com caixa de busca inteligente conectada à API do TMDB (preenchimento automático com 1 clique de título, ano, gênero, sinopse e pôster) e upload manual por drag & drop.

- **Atualizações em Telas Existentes:**
  - `src/components/Navbar.vue`: adicionado link "Filmes" com ícone de claquete (`Film`), navegação mobile com atalho para adicionar filme e integração com reset da store no logout.
  - `src/views/ReviewsView.vue`: adicionado seletor de abas ("Todos", "Livros" e "Filmes") unificando as resenhas do usuário em uma única linha do tempo ordenada por data.
  - `src/views/DashboardView.vue`: cartões com métricas de filmes assistidos no ano e média de avaliações, seção "Assistindo Agora" com cards interativos, atalho "+ Filme" no banner de boas-vindas e rodapé com atribuição oficial exigida pela API do TMDB.
  - `src/router/index.ts`: registradas as novas rotas protegidas (`/filmes`, `/filmes/novo`, `/filmes/:id`, `/filmes/:id/editar`).

---

### 📦 Build & Qualidade de Código

- Verificação estrita de tipagem validada com `npx vue-tsc -b` (0 erros).
- Bundle de produção compilado com sucesso via Vite (`npm run build`).
