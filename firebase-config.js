/*
 * fraude. — Firebase configuration
 *
 * Esta versão NÃO altera a planilha da pesquisa.
 * Para ativar login, comentários e administração no Firebase, substitua
 * FRAUDE_FIREBASE_CONFIG pelo objeto Web App Config fornecido pelo Firebase.
 * Enquanto estiver vazio, o site mantém o modo de demonstração local.
 */
window.FRAUDE_FIREBASE_CONFIG = window.FRAUDE_FIREBASE_CONFIG || null;
window.FRAUDE_FIREBASE_OPTIONS = {
  useAuth: true,
  useFirestore: true,
  useStorage: true,
  adminEmails: []
};
