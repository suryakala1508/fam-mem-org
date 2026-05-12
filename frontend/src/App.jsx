import { useState, useEffect, useCallback } from "react";
import Dashboard from "./components/Dashboard";
import MemoriesPage from "./components/MemoriesPage";
import MembersPage from "./components/MembersPage";
import TimelinePage from "./components/TimelinePage";
import "./App.css";

const NAV = [
  { id: "dashboard", label: "Home",     icon: "🏡" },
  { id: "memories",  label: "Memories", icon: "📷" },
  { id: "timeline",  label: "Timeline", icon: "📅" },
  { id: "members",   label: "Family",   icon: "👨‍👩‍👧‍👦" },
];

const API = "http://localhost:5000/api";
const API_BASE = "http://localhost:5000";

export default function App() {
  const [page, setPage]         = useState("dashboard");
  const [members, setMembers]   = useState([]);
  const [memories, setMemories] = useState([]);
  const [tags, setTags]         = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);

  // FIX: Normalize MongoDB _id → id for every document
  const normalize = (arr) =>
    arr.map((item) => ({ ...item, id: item._id || item.id }));

  // FIX: Extract tags from memories instead of a missing /api/tags endpoint
  const extractTags = (memoriesArr) => {
    const tagSet = new Set();
    memoriesArr.forEach((m) => (m.tags || []).forEach((t) => tagSet.add(t)));
    return [...tagSet].map((name, i) => ({ id: i, name }));
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Removed fetch(`${API}/tags`) — that route doesn't exist
      const [membersRaw, memoriesRaw, statsRaw] = await Promise.all([
        fetch(`${API}/members`).then((r) => r.json()),
        fetch(`${API}/memories`).then((r) => r.json()),
        fetch(`${API}/stats`).then((r) => r.json()),
      ]);

      const normalizedMembers  = normalize(Array.isArray(membersRaw)  ? membersRaw  : []);
      const normalizedMemories = normalize(Array.isArray(memoriesRaw) ? memoriesRaw : []);

      setMembers(normalizedMembers);
      setMemories(normalizedMemories);
      setTags(extractTags(normalizedMemories));
      setStats(statsRaw || {});
    } catch (e) {
      console.error("API error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ctx = { members, memories, tags, stats, refresh, API, API_BASE };

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🌳</span>
          <span className="brand-text">FamilyVault</span>
        </div>
        <ul className="sidebar-nav">
          {NAV.map((n) => (
            <li key={n.id}>
              <button
                className={`nav-btn${page === n.id ? " active" : ""}`}
                onClick={() => setPage(n.id)}
              >
                <span className="nav-icon">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <p>Your memories,</p>
          <p>beautifully kept.</p>
        </div>
      </nav>

      <main className="main-content">
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Loading your family memories…</p>
          </div>
        ) : (
          <>
            {page === "dashboard" && (
              <Dashboard {...ctx} onNavigate={setPage} />
            )}
            {page === "memories" && <MemoriesPage {...ctx} />}
            {page === "timeline" && <TimelinePage {...ctx} />}
            {page === "members"  && <MembersPage  {...ctx} />}
          </>
        )}
      </main>
    </div>
  );
}