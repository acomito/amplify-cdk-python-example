const apiUrl = import.meta.env.VITE_API_URL;

const config = {
  apiUrl: apiUrl.startsWith("http")
    ? `${apiUrl}`
    : `${window.location.origin}${apiUrl}`,
};

export default config;
