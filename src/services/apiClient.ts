import axios from 'axios';

import { camelizeKeys } from './mappers';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Les réponses de l'API sont en snake_case (Pydantic) : on les convertit en
// camelCase une fois pour toutes ici, pour que les hooks reçoivent
// directement des objets typés src/types/domain.ts. Les query params
// SORTANTS ne sont jamais transformés par cet interceptor.
apiClient.interceptors.response.use((response) => {
  response.data = camelizeKeys(response.data);
  return response;
});
