import { useState, useRef } from "react";

const API_BASE = "http://localhost:5000";

export default function MembersPage({ members, refresh, API }) {
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this family member?")) return;
    await fetch(`${API}/members/${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div>
      <div className="page-header">
        <h1>👨‍👩‍👧‍👦 Family Members</h1>
        <p>Manage profiles for everyone in your family tree.</p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <button className="btn btn-primary" onClick={() => { setEditMember(null); setShowForm(true); }}>
          + Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No family members yet</h3>
          <p>Add your first family member to get started.</p>
        </div>
      ) : (
        <div className="members-grid">
          {members.map(m => (
            <div className="member-card" key={m.id} onClick={() => { setEditMember(m); setShowForm(true); }}>
              <div className="member-avatar">
                {m.avatar_url
                  ? <img src={`${API_BASE}${m.avatar_url}`} alt={m.name} />
                  : m.name[0].toUpperCase()}
              </div>
              <div className="member-name">{m.name}</div>
              {m.relation   && <div className="member-relation">{m.relation}</div>}
              {m.birth_date && <div className="member-birthdate">🎂 {new Date(m.birth_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</div>}
              {m.bio && <p style={{ fontSize: ".8rem", color: "var(--text-l)", marginTop: ".5rem", lineHeight: 1.5 }}>{m.bio}</p>}
              <div className="member-actions" onClick={e => e.stopPropagation()}>
                <button className="btn btn-secondary btn-sm" onClick={() => { setEditMember(m); setShowForm(true); }}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MemberFormModal
          member={editMember}
          API={API}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); refresh(); }}
        />
      )}
    </div>
  );
}

function MemberFormModal({ member, API, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:       member?.name       || "",
    relation:   member?.relation   || "",
    birth_date: member?.birth_date || "",
    bio:        member?.bio        || "",
  });
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const fileRef = useRef();

  const handleFile = (f) => { setFile(f); setPreview(URL.createObjectURL(f)); };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert("Name is required");
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("avatar", file);
    const url    = member ? `${API}/members/${member.id}` : `${API}/members`;
    const method = member ? "PUT" : "POST";
    await fetch(url, { method, body: fd });
    setSaving(false);
    onSaved();
  };

  const RELATIONS = ["Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Grandfather", "Grandmother", "Uncle", "Aunt", "Cousin", "Spouse", "Other"];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{member ? "Edit Member" : "Add Family Member"}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Avatar */}
          <div className="form-group" style={{ textAlign: "center" }}>
            <div
              className="member-avatar"
              style={{ width: 90, height: 90, fontSize: "2.2rem", margin: "0 auto 1rem", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
            >
              {preview
                ? <img src={preview} alt="preview" />
                : member?.avatar_url
                  ? <img src={`http://localhost:5000${member.avatar_url}`} alt={member.name} />
                  : (form.name[0] || "?").toUpperCase()}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Upload Photo</button>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Priya Sharma" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Relation</label>
              <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}>
                <option value="">Select relation</option>
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label>Bio / About</label>
            <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="A few words about this family member…" />
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : member ? "Update" : "Add Member"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}