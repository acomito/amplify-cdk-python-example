import { useState } from "react";
import config from "./config";
import Plot from "react-plotly.js";
import { Data, Layout } from "plotly.js";

interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
}

interface ApiResponse {
  users: User[];
  plot: {
    data: Data[];
    layout: Partial<Layout>;
  };
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
      <h1>Python + React + CDK + App Runner + Amplify = Example App</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? "Loading..." : "Get Python API Response"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data?.plot && (
        <div style={{ marginTop: "2rem" }}>
          <h2>User Activity Plot</h2>
          <Plot
            data={data.plot.data}
            layout={{
              ...data.plot.layout,
              width: 720,
              height: 480,
            }}
          />
        </div>
      )}
    </main>
  );
}

export default App;
