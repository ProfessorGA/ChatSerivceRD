export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:5275' 
          : 'https://chatserivcerd.onrender.com'

};
