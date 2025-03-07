const apiUrl = import.meta.env.VITE_API_URL;

const config = {
  apiUrl: apiUrl.startsWith("http") ? `${apiUrl}` : `https://${apiUrl}`,
};

console.log({ config, apiUrl });

export default config;
