export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  apiPath: '/api',
  get baseApiUrl() {
    return `${this.apiUrl}${this.apiPath}`;
  }
}; 