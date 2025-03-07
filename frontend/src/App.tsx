import { useState } from "react";
import config from "./config";

interface ApiResponse {
  message?: string;
  // Add other expected response fields here
}

function App() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(config.apiUrl + "/users");

      if (!response?.ok) {
        throw new Error(`HTTP error happened with status: ${response?.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>My python test app</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Loading..." : "Get Python API Response"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}

export default App;
