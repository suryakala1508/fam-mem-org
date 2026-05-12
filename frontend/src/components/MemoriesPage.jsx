import { useState, useRef } from "react";

const API_BASE = "http://localhost:5000";

export default function MemoriesPage({ memories, members, tags, refresh, API }) {
  const [search, setSearch]         = useState("");
  const [activeTag, setActiveTag]   = useState("");
  const [activeMember, setActiveMember] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editMemory, setEditMemory] = useState(null);
  const [viewMemory, setViewMemory] = useState(null);

  // Filter
  const filtered = memories.filter(m => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q) ||
      (m.location || "").toLowerCase().includes(q);
    const matchTag    = !activeTag    || m.tags.includes(activeTag);
    const matchMember = !activeMember || m.member_ids.map(String).includes(String(activeMember));
    return matchSearch && matchTag && matchMember;
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this memory?")) return;
    await fetch(`${API}/memories/${id}`, { method: "DELETE" });
    setViewMemory(null);
    refresh();
  };

  return (
    <div>
      <div className="page-header">
        <h1>📷 Memories</h1>
        <p>All your family's cherished moments in one place.</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          className="search-input"
          placeholder="Search memories…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="search-input"
          style={{ flex: "none", width: 170 }}
          value={activeMember}
          onChange={e => setActiveMember(e.target.value)}
        >
          <option value="">All members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => { setEditMemory(null); setShowForm(true); }}>
          + Add Memory
        </button>
      </div>

      {/* Tag pills */}
      {tags.length > 0 && (
        <div className="tags" style={{ marginBottom: "1.5rem" }}>
          <span
            className={`tag clickable${!activeTag ? " active" : ""}`}
            onClick={() => setActiveTag("")}
          >All</span>
          {tags.map(t => (
            <span
              key={t.id}
              className={`tag clickable${activeTag === t.name ? " active" : ""}`}
              onClick={() => setActiveTag(activeTag === t.name ? "" : t.name)}
            >{t.name}</span>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No memories found</h3>
          <p>Try adjusting your filters or add a new memory.</p>
        </div>
      ) : (
        <div className="memories-grid">
          {filtered.map(m => (
            <div className="memory-card" key={m.id} onClick={() => setViewMemory(m)}>
              {m.file_url ? (
                m.file_type === "video"
                  ? <video className="memory-media" src={`${API_BASE}${m.file_url}`} />
                  : <img className="memory-media" src={`${API_BASE}${m.file_url}`} alt={m.title} />
              ) : (
                <div className="memory-media-placeholder">📷</div>
              )}
              <div className="memory-body">
                <div className="memory-title">{m.title}</div>
                {m.date && (
                  <div className="memory-date">
                    {new Date(m.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    {m.location && ` · ${m.location}`}
                  </div>
                )}
                {m.description && <div className="memory-desc">{m.description}</div>}
                {m.tags.length > 0 && (
                  <div className="tags" style={{ marginTop: 6 }}>
                    {m.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <MemoryFormModal
          memory={editMemory}
          members={members}
          tags={tags}
          API={API}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh(); }}
        />
      )}

      {/* View Detail Modal */}
      {viewMemory && (
        <MemoryDetailModal
          memory={viewMemory}
          members={members}
          onClose={() => setViewMemory(null)}
          onEdit={() => { setEditMemory(viewMemory); setViewMemory(null); setShowForm(true); }}
          onDelete={() => handleDelete(viewMemory.id)}
        />
      )}
    </div>
  );
}

// ── Memory Form Modal ─────────────────────────────────────────────────────────
function MemoryFormModal({ memory, members, tags, API, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       memory?.title       || "",
    description: memory?.description || "",
    date:        memory?.date        || "",
    location:    memory?.location    || "",
    tags:        memory?.tags        || [],
    member_ids:  memory?.member_ids?.map(String) || [],
  });
  const [tagInput, setTagInput]   = useState("");
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [saving, setSaving]       = useState(false);
  const [drag, setDrag]           = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const toggleMember = (id) => {
    setForm(p => ({
      ...p,
      member_ids: p.member_ids.includes(String(id))
        ? p.member_ids.filter(m => m !== String(id))
        : [...p.member_ids, String(id)],
    }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }));
    setTagInput("");
  };

  const removeTag = (t) => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("Title is required");
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) =>
      fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v)
    );
    if (file) fd.append("file", file);

    const url    = memory ? `${API}/memories/${memory.id}` : `${API}/memories`;
    const method = memory ? "PUT" : "POST";
    await fetch(url, { method, body: fd });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{memory ? "Edit Memory" : "Add New Memory"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Media Upload */}
          <div className="form-group">
            <label>Photo / Video</label>
            <div
              className={`upload-zone${drag ? " drag" : ""}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={e => handleFile(e.target.files[0])} />
              {preview ? (
                <div className="upload-preview">
                  {file?.type.startsWith("video")
                    ? <video src={preview} controls style={{ width: "100%", borderRadius: 8 }} />
                    : <img src={preview} alt="preview" />}
                </div>
              ) : memory?.file_url ? (
                <div className="upload-preview">
                  {memory.file_type === "video"
                    ? <video src={`http://localhost:5000${memory.file_url}`} style={{ width: "100%", borderRadius: 8 }} />
                    : <img src={`http://localhost:5000${memory.file_url}`} alt="current" />}
                  <p style={{ marginTop: 8, fontSize: ".8rem" }}>Click to replace</p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📁</div>
                  <p>Drag & drop or click to upload</p>
                  <p style={{ fontSize: ".8rem", marginTop: ".3rem", opacity: .7 }}>Images & Videos up to 100MB</p>
                </>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer vacation 2023" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Goa, India" />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What makes this memory special?" />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                style={{ flex: 1 }}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type a tag and press Enter"
              />
              <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
            </div>
            <div className="tags">
              {form.tags.map(t => (
                <span key={t} className="tag" style={{ cursor: "pointer" }} onClick={() => removeTag(t)}>
                  {t} ×
                </span>
              ))}
              {tags.filter(t => !form.tags.includes(t.name)).map(t => (
                <span key={t.id} className="tag clickable" onClick={() => setForm(p => ({ ...p, tags: [...p.tags, t.name] }))}>
                  + {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div className="form-group">
              <label>Who's in this memory?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {members.map(m => (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: ".87rem" }}>
                    <input
                      type="checkbox"
                      checked={form.member_ids.includes(String(m.id))}
                      onChange={() => toggleMember(m.id)}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : memory ? "Update Memory" : "Save Memory"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Memory Detail Modal ───────────────────────────────────────────────────────
function MemoryDetailModal({ memory, members, onClose, onEdit, onDelete }) {
  const memberMap = Object.fromEntries(members.map(m => [String(m.id), m]));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h2>{memory.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {memory.file_url && (
            memory.file_type === "video"
              ? <video className="detail-media" src={`http://localhost:5000${memory.file_url}`} controls />
              : <img className="detail-media" src={`http://localhost:5000${memory.file_url}`} alt={memory.title} />
          )}

          <div className="detail-meta">
            {memory.date && (<><span className="dm-label">📅 Date</span><span className="dm-value">{new Date(memory.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span></>)}
            {memory.location && (<><span className="dm-label">📍 Location</span><span className="dm-value">{memory.location}</span></>)}
          </div>

          {memory.description && <p className="detail-desc">{memory.description}</p>}

          {memory.tags.length > 0 && (
            <div className="tags" style={{ marginBottom: "1rem" }}>
              {memory.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          )}

          {memory.member_ids.length > 0 && (
            <div className="detail-members">
              {memory.member_ids.map(id => {
                const m = memberMap[String(id)];
                return m ? <span key={id} className="member-chip">👤 {m.name}</span> : null;
              })}
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-danger btn-sm" onClick={onDelete}>🗑 Delete</button>
            <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Edit</button>
            <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}