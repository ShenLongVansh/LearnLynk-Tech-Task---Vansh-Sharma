import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "../../lib/supabaseClient";

type Task = {
  id: string;
  type: string;
  status: string;
  application_id: string;
  due_at: string;
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #ccc",
  fontWeight: "bold",
};

const tdStyle: CSSProperties = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

export default function TodayDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function fetchTasks(isInitial = false) {
    if (isInitial) {
      setInitialLoading(true);
    }
    setError(null);

    try {

      // TODO:
      // - Query tasks that are due today and not completed
      // - Use supabase.from("tasks").select(...)
      // - You can do date filtering in SQL or client-side

      // Example:
      // const { data, error } = await supabase
      //   .from("tasks")
      //   .select("*")
      //   .eq("status", "open");
      
      
      // Answer Starts

      const today = new Date();

      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("tasks")
        .select("id, type, status, application_id, due_at")
        .gte("due_at", startOfDay.toISOString())
        .lte("due_at", endOfDay.toISOString())
        .neq("status", "completed")
        .order("due_at", { ascending: true });

      if (error) throw error;

      setTasks((data ?? []) as Task[]);

      //Answer Ends


    } catch (err: any) {
      console.error(err);
      setError("Failed to load tasks");
    } finally {
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  }

  async function markComplete(id: string) {
    try {

      // TODO:
      // - Update task.status to 'completed'
      // - Re-fetch tasks or update state optimistically
      
      
      // Answer Starts

      setUpdatingId(id);
      setError(null);

      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      // tweaked some bits of code to avoid flashing screen while the task is being marked as complete and state changes.
      await fetchTasks(false);

      // Show success banner briefly
      setSuccessMessage("Task marked as completed ✅");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);

      //Answer Ends


    } catch (err: any) {
      console.error(err);
      alert("Failed to update task");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    fetchTasks(true);
  }, []);

  //patched UI a bit for better visuals (could be better always)

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "2rem auto",
        padding: "1.5rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        Today&apos;s Tasks
      </h1>

      {initialLoading && (
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading tasks...
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#d1fae5",
            border: "1px solid #34d399",
            borderRadius: "6px",
            color: "#065f46",
            textAlign: "center",
            fontSize: "0.95rem",
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "1rem",
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            backgroundColor: "#fee2e2",
            border: "1px solid #f87171",
            borderRadius: "6px",
            color: "#7f1d1d",
            textAlign: "center",
            fontSize: "0.95rem",
          }}
        >
          {error}
        </div>
      )}

      {!initialLoading && tasks.length === 0 && (
        <p
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: "1.1rem",
          }}
        >
          No tasks due today 🎉
        </p>
      )}

      {tasks.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
            background: "#fafafa",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#ececec" }}>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Application ID</th>
              <th style={thStyle}>Due At</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, index) => (
              <tr
                key={t.id}
                style={{
                  background: index % 2 === 0 ? "#fff" : "#f4f4f4",
                }}
              >
                <td style={tdStyle}>{t.type}</td>
                <td
                  style={{
                    ...tdStyle,
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                  }}
                >
                  {t.application_id}
                </td>
                <td style={tdStyle}>
                  {new Date(t.due_at).toLocaleString()}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    textTransform: "capitalize",
                  }}
                >
                  {t.status}
                </td>
                <td style={tdStyle}>
                  {t.status !== "completed" && (
                    // console for including task id as well for debugging purpose
                    <button
                      onClick={() => {
                        console.log("Completing task id:", t.id, "for application:", t.application_id);
                        markComplete(t.id);
                      }}
                      disabled={updatingId === t.id}
                      style={{
                        padding: "5px 10px",
                        background:
                          updatingId === t.id ? "#9ca3af" : "#0070f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          updatingId === t.id ? "default" : "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      {updatingId === t.id ? "Updating..." : "Mark Complete"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
