const API_BASE = "http://localhost:5000";

export default function Dashboard({ stats, memories, members, onNavigate }) {
  const recent = memories.slice(0, 6);

  // FIX: Compute withMedia and totalTags from actual data
  // because backend doesn't return these fields
  const withMedia  = memories.filter((m) => m.file_url).length;
  const totalTags  = new Set(memories.flatMap((m) => m.tags || [])).size;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome to FamilyVault 🌳</h1>
        <p>A warm place to store and cherish your family's most precious memories.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📷</span>
          {/* FIX: use stats.totalMemories from backend */}
          <span className="stat-value">{stats.totalMemories ?? 0}</span>
          <span className="stat-label">Memories</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👨‍👩‍👧‍👦</span>
          <span className="stat-value">{stats.totalMembers ?? 0}</span>
          <span className="stat-label">Family Members</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏷️</span>
          {/* FIX: computed from memories, not from missing stats field */}
          <span className="stat-value">{totalTags}</span>
          <span className="stat-label">Tags</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🎬</span>
          {/* FIX: computed from memories, not from missing stats field */}
          <span className="stat-value">{withMedia}</span>
          <span className="stat-label">With Media</span>
        </div>
      </div>

      {/* Recent memories */}
      <div className="section-heading">
        <h2>Recent Memories</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("memories")}
        >
          View All →
        </button>
      </div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No memories yet</h3>
          <p>Start adding your family's precious moments!</p>
          <br />
          <button
            className="btn btn-primary"
            onClick={() => onNavigate("memories")}
          >
            Add First Memory
          </button>
        </div>
      ) : (
        <div className="recent-strip">
          {recent.map((m) => (
            <div className="memory-card" key={m.id} style={{ cursor: "default" }}>
              {m.file_url ? (
                m.file_type === "video" ? (
                  <video
                    className="memory-media"
                    src={`${API_BASE}${m.file_url}`}
                  />
                ) : (
                  <img
                    className="memory-media"
                    src={`${API_BASE}${m.file_url}`}
                    alt={m.title}
                  />
                )
              ) : (
                <div className="memory-media-placeholder">📷</div>
              )}
              <div className="memory-body">
                <div className="memory-title">{m.title}</div>
                {m.date && (
                  <div className="memory-date">
                    {new Date(m.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Family members strip */}
      {members.length > 0 && (
        <>
          <div
            className="section-heading"
            style={{ marginTop: "2.5rem" }}
          >
            <h2>Family Members</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate("members")}
            >
              Manage →
            </button>
          </div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {members.slice(0, 8).map((m) => (
              <div key={m.id} style={{ textAlign: "center" }}>
                <div
                  className="member-avatar"
                  style={{ width: 56, height: 56, fontSize: "1.3rem" }}
                >
                  {m.avatar_url ? (
                    <img
                      src={`${API_BASE}${m.avatar_url}`}
                      alt={m.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.textContent = m.name[0].toUpperCase();
                      }}
                    />
                  ) : (
                    m.name[0].toUpperCase()
                  )}
                </div>
                <div style={{ fontSize: ".8rem", marginTop: 4 }}>
                  {m.name.split(" ")[0]}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}