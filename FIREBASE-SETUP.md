# fraude. — Firebase

A integração da planilha da pesquisa foi deixada de fora propositalmente nesta versão.

## Ativar login real
1. Crie um projeto no Firebase.
2. Ative Authentication > Sign-in method > Email/Password.
3. Crie um Firestore Database.
4. Ative Storage.
5. Registre um Web App e copie o objeto `firebaseConfig`.
6. Abra `firebase-config.js` e atribua esse objeto a `window.FRAUDE_FIREBASE_CONFIG`.
7. Publique novamente.

A estrutura já carrega Firebase Auth, Firestore e Storage e expõe `window.FRAUDE_FIREBASE` quando a configuração existe.

## Estrutura sugerida do Firestore
- `users/{uid}` — perfil público
- `news/{newsId}` — notícias e metadados
- `comments/{commentId}` — comentários, `userId`, `newsId`, `text`, `createdAt`, `status`
- `golpes/{golpeId}` — conteúdo, capa, fontes e atualização
- `settings/site` — configurações editoriais

## Segurança
Não deixe regras de Firestore/Storage abertas em produção. Use Firebase Auth + Security Rules para limitar escrita a usuários autenticados e administração por UID/e-mail autorizado.
