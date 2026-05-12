import { useState } from "react";

export default function TimelinePage({ memories, members, stats, API_BASE }) {
  const [activeYear, setActiveYear] = useState("");
  const [viewMemory, setViewMemory] = useState(null);

  // FIX: use m.id (normalized _id from App.jsx)
  const memberMap = Object.fromEntries(
    members.map((m) => [String(m.id), m])
  );

  // Group by year
  const withDate  = memories.filter((m) => m.date);
  const noDate    = memories.filter((m) => !m.date);
  const years     = [
    ...new Set(withDate.map((m) => m.date.slice(0, 4))),
  ].sort((a, b) => b - a);
  const filtYears = activeYear ? [activeYear] : years;

  const grouped = filtYears.reduce((acc, y) => {
    acc[y] = withDate
      .filter((m) => m.date.startsWith(y))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>📅 Timeline</h1>
        <p>Your family's story, told through time.</p>
      </div>

      {/* Year filter */}
      {years.length > 1 && (
        <div className="year-pills">
          <span
            className={`year-pill${!activeYear ? " active" : ""}`}
            onClick={() => setActiveYear("")}
          >
            All years
          </span>
          {years.map((y) => (
            <span
              key={y}
              className={`year-pill${activeYear === y ? " active" : ""}`}
              onClick={() => setActiveYear(activeYear === y ? "" : y)}
            >
              {y}
            </span>
          ))}
        </div>
      )}

      {memories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No memories yet</h3>
          <p>Add memories with dates to see your family timeline.</p>
        </div>
      ) : (
        <div className="timeline">
          {filtYears.map(
            (year) =>
              grouped[year]?.length > 0 && (
                <div key={year}>
                  <div className="timeline-year">{year}</div>
                  {grouped[year].map((m) => (
                    <div className="timeline-item" key={m.id}>
                      <div className="timeline-dot" />
                      <div
                        className="timeline-card"
                        onClick={() => setViewMemory(m)}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "flex-start",
                          }}
                        >
                          {m.file_url && (
                            m.file_type === "video" ? (
                              <video
                                src={`${API_BASE}${m.file_url}`}
                                style={{
                                  width: 90, height: 65,
                                  objectFit: "cover", borderRadius: 8,
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <img
                                src={`${API_BASE}${m.file_url}`}
                                alt={m.title}
                                style={{
                                  width: 90, height: 65,
                                  objectFit: "cover", borderRadius: 8,
                                  flexShrink: 0,
                                }}
                              />
                            )
                          )}
                          <div style={{ flex: 1 }}>
                            <div className="timeline-title">{m.title}</div>
                            <div className="timeline-meta">
                              <span>
                                📅{" "}
                                {new Date(m.date).toLocaleDateString("en-IN", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                              {m.location && (
                                <span>📍 {m.location}</span>
                              )}
                              {(m.member_ids || []).length > 0 && (
                                <span>
                                  👤{" "}
                                  {m.member_ids
                                    .map((id) => memberMap[String(id)]?.name)
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                            {m.description && (
                              <p
                                style={{
                                  fontSize: ".85rem",
                                  color: "var(--text-m)",
                                  marginTop: ".4rem",
                                  lineHeight: 1.5,
                                }}
                              >
                                {m.description.length > 120
                                  ? m.description.slice(0, 120) + "…"
                                  : m.description}
                              </p>
                            )}
                            {(m.tags || []).length > 0 && (
                              <div className="tags" style={{ marginTop: 6 }}>
                                {m.tags.map((t) => (
                                  <span key={t} className="tag">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}

          {/* Memories without dates */}
          {!activeYear && noDate.length > 0 && (
            <div>
              <div
                className="timeline-year"
                style={{ color: "var(--text-l)" }}
              >
                Undated
              </div>
              {noDate.map((m) => (
                <div className="timeline-item" key={m.id}>
                  <div
                    className="timeline-dot"
                    style={{ background: "var(--sand)" }}
                  />
                  <div
                    className="timeline-card"
                    onClick={() => setViewMemory(m)}
                  >
                    <div className="timeline-title">{m.title}</div>
                    <div className="timeline-meta">
                      {m.location && <span>📍 {m.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick detail modal */}
      {viewMemory && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setViewMemory(null)
          }
        >
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{viewMemory.title}</h2>
              <button
                className="modal-close"
                onClick={() => setViewMemory(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {viewMemory.file_url && (
                viewMemory.file_type === "video" ? (
                  <video
                    className="detail-media"
                    src={`${API_BASE}${viewMemory.file_url}`}
                    controls
                  />
                ) : (
                  <img
                    className="detail-media"
                    src={`${API_BASE}${viewMemory.file_url}`}
                    alt={viewMemory.title}
                  />
                )
              )}
              <div className="detail-meta">
                {viewMemory.date && (
                  <>
                    <span className="dm-label">📅 Date</span>
                    <span className="dm-value">
                      {new Date(viewMemory.date).toLocaleDateString("en-IN", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                  </>
                )}
                {viewMemory.location && (
                  <>
                    <span className="dm-label">📍 Location</span>
                    <span className="dm-value">{viewMemory.location}</span>
                  </>
                )}
              </div>
              {viewMemory.description && (
                <p className="detail-desc">{viewMemory.description}</p>
              )}
              {(viewMemory.member_ids || []).length > 0 && (
                <div className="detail-members">
                  {viewMemory.member_ids.map((id) => {
                    const m = memberMap[String(id)];
                    return m ? (
                      <span key={id} className="member-chip">👤 {m.name}</span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setViewMemory(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}