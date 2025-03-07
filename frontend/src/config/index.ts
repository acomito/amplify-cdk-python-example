const apiUrl = import.meta.env.VITE_API_URL;

const config = {
  apiUrl: apiUrl.startsWith("http")
    ? `${apiUrl}`
    : `${window.location.origin}${apiUrl}`,
};

console.log({ config, apiUrl });

export default config;
