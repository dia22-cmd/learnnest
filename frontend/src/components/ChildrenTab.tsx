import { useEffect, useState } from "react";
import {
  getChildren,
  createChild,
  updateChild,
  deleteChild,
  assignMaterialToChild,
  unassignMaterialFromChild,
  getChildAssignments,
  type Child
} from "../services/children";
import type { Material } from "../types/material";

interface ChildrenTabProps {
  materials: Material[];
}

const PALETTE = {
  cream: "#F7EFE0",
  panel: "#EFE3CD",
  deepCream: "#E6D5B8",
  ink: "#2A1810",
  accent: "#E5733B",
  accentDeep: "#C4541F",
  soft: "#FBF6EC",
  green: "#4E8D7C",
  greenDeep: "#386F60",
};

export default function ChildrenTab({ materials }: ChildrenTabProps) {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({}); // childId -> materialIds[]
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("medium");
  const [modalOpen, setModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    loadChildrenData();
  }, []);

  async function loadChildrenData() {
    try {
      setLoading(true);
      const kids = await getChildren();
      setChildrenList(kids);

      const mapping: Record<string, string[]> = {};
      for (const kid of kids) {
        const assigned = await getChildAssignments(kid.id);
        mapping[kid.id] = assigned.map((m) => m.id);
      }
      setAssignments(mapping);
    } catch (err) {
      console.error("Failed to load children profiles", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateChild(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Please enter a name.");
      return;
    }
    try {
      setError("");
      const newKid = await createChild(newName.trim(), newDifficulty);
      setNewName("");
      setNewDifficulty("medium");
      setModalOpen(false);
      setChildrenList([...childrenList, newKid]);
      setAssignments({ ...assignments, [newKid.id]: [] });
    } catch (err) {
      setError("Failed to create child profile.");
      console.error(err);
    }
  }

  async function handleDifficultyChange(childId: string, level: string) {
    try {
      await updateChild(childId, { difficulty_level: level });
      setChildrenList(
        childrenList.map((c) => (c.id === childId ? { ...c, difficulty_level: level } : c))
      );
    } catch (err) {
      console.error("Failed to update difficulty", err);
    }
  }

  async function handleAssignmentToggle(childId: string, materialId: string) {
    const current = assignments[childId] || [];
    const isAssigned = current.includes(materialId);
    try {
      if (isAssigned) {
        await unassignMaterialFromChild(childId, materialId);
        setAssignments({
          ...assignments,
          [childId]: current.filter((id) => id !== materialId),
        });
      } else {
        await assignMaterialToChild(childId, materialId);
        setAssignments({
          ...assignments,
          [childId]: [...current, materialId],
        });
      }
    } catch (err) {
      console.error("Failed to toggle assignment", err);
    }
  }

  async function handleDeleteChild(childId: string) {
    if (!window.confirm("Are you sure you want to delete this child profile? This will not delete historical analytics.")) return;
    try {
      await deleteChild(childId);
      setChildrenList(childrenList.filter((c) => c.id !== childId));
    } catch (err) {
      console.error("Failed to delete child", err);
    }
  }

  function handleCopyLink(childId: string) {
    const solveUrl = `${window.location.origin}/solve/child/${childId}`;
    navigator.clipboard.writeText(solveUrl);
    setCopyFeedback({ ...copyFeedback, [childId]: true });
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [childId]: false }));
    }, 2000);
  }

  if (loading) {
    return <div style={{ textAlign: "center", padding: "48px 0", color: PALETTE.ink, opacity: 0.5 }}>Loading child profiles...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: PALETTE.ink, margin: 0 }}>Child Profiles</h2>
          <p style={{ fontSize: 14, color: PALETTE.ink, opacity: 0.65, marginTop: 4 }}>
            Create profiles for each child in your household, customize their difficulty, and assign worksheets.
          </p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setError(""); }}
          style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 0 ${PALETTE.accentDeep}`, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          ➕ Add Profile
        </button>
      </div>

      {childrenList.length === 0 ? (
        <div style={{ background: PALETTE.soft, border: `2px dashed ${PALETTE.deepCream}`, borderRadius: 18, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🐣</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No child profiles yet</h3>
          <p style={{ fontSize: 14, opacity: 0.6, maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.5 }}>
            Create profiles to track separate learning progress and unlock adaptive difficulty levels.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          {childrenList.map((child) => (
            <div key={child.id} style={{ background: PALETTE.soft, border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Profile Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#FFE8D6", border: `2px solid ${PALETTE.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    🦉
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: PALETTE.ink, margin: 0 }}>{child.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 12, opacity: 0.6 }}>Difficulty Level:</span>
                      <select
                        value={child.difficulty_level}
                        onChange={(e) => handleDifficultyChange(child.id, e.target.value)}
                        style={{ background: "#fff", border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 8, padding: "2px 8px", fontSize: 13, fontWeight: 600, color: PALETTE.ink, outline: "none" }}
                      >
                        <option value="easy">Easy (Literal & Simple)</option>
                        <option value="medium">Medium (Standard)</option>
                        <option value="hard">Hard (Advanced & Conceptual)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handleCopyLink(child.id)}
                    style={{ background: copyFeedback[child.id] ? PALETTE.green : PALETTE.soft, color: copyFeedback[child.id] ? "#fff" : PALETTE.ink, border: `1.5px solid ${copyFeedback[child.id] ? PALETTE.green : PALETTE.deepCream}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                  >
                    {copyFeedback[child.id] ? "✓ Copied!" : "📋 Copy solver link"}
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    style={{ background: "transparent", color: "#CE3B3B", border: "1.5px solid #EFA7A7", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Assignments Section */}
              <div style={{ borderTop: `1.5px solid ${PALETTE.deepCream}`, paddingTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: PALETTE.ink, marginBottom: 12 }}>Assigned Materials</h4>
                {materials.length === 0 ? (
                  <p style={{ fontSize: 13, opacity: 0.6, fontStyle: "italic", margin: 0 }}>Please upload study materials first.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {materials.map((m) => {
                      const isChecked = (assignments[child.id] || []).includes(m.id);
                      return (
                        <label
                          key={m.id}
                          style={{ display: "flex", alignItems: "center", gap: 10, background: isChecked ? "#E5F4EE" : "#fff", border: `1.5px solid ${isChecked ? PALETTE.green : PALETTE.deepCream}`, borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleAssignmentToggle(child.id, m.id)}
                            style={{ accentColor: PALETTE.green, cursor: "pointer" }}
                          />
                          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{m.title}</span>
                          <span style={{ fontSize: 11, background: PALETTE.deepCream, padding: "2px 6px", borderRadius: 6, marginLeft: "auto", flexShrink: 0 }}>
                            {m.subject}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal child form */}
      {modalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(42, 24, 16, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <form onSubmit={handleCreateChild} style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: PALETTE.ink, margin: "0 0 20px" }}>Create Child Profile</h3>

            {error && <div style={{ color: "#CE3B3B", background: "#FDECEC", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Child's Name</label>
              <input
                type="text"
                placeholder="e.g. Liam"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={50}
                style={{ background: "#fff", border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", color: PALETTE.ink }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Starting Difficulty</label>
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
                style={{ background: "#fff", border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none", color: PALETTE.ink }}
              >
                <option value="easy">Easy (Basic & Literal)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Conceptual & Advanced)</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: "transparent", border: `1.5px solid ${PALETTE.deepCream}`, borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: PALETTE.accent, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 0 ${PALETTE.accentDeep}` }}
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
