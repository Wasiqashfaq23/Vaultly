import "./Dashboard.css"
import { GoEye, GoEyeClosed, GoCopy, GoCheck } from "react-icons/go"
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { apiFetch } from '../../src/api'
import { toast } from '../../src/toast'

const schema = yup.object({
  service: yup.string().trim().required("Service is required"),
  email: yup.string().trim().required("Email is required").email("Enter a valid email"),
  password: yup.string().required("Password is required"),
}).required()

const REVEAL_MS = 10000

const Dashboard = ({ onSessionExpired }) => {
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [passwords, setpasswords] = useState([])
  const [user, setuser] = useState("")
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showInput, setShowInput] = useState(false)
  const [showEditInput, setShowEditInput] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const sessionLost = (res) => {
    if (res.status !== 401) return false
    if (typeof onSessionExpired === "function") onSessionExpired()
    return true
  }

  const fetchPasswords = async () => {
    try {
      const { res, data } = await apiFetch('/password')
      if (sessionLost(res)) return
      if (res.ok) {
        setpasswords(Array.isArray(data.passwords) ? data.passwords : [])
      } else {
        toast(data?.message || "Could not load passwords", "error")
      }
    } catch {
      toast("Cannot reach the server.", "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const { res, data } = await apiFetch('/me')
      if (sessionLost(res)) return
      if (res.ok) setuser(data?.userName || "")
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    (async () => {
      await fetchPasswords()
      await fetchUser()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleVisibility = (id) => {
    setVisiblePasswords((prev) => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) {
        setTimeout(() => {
          setVisiblePasswords((cur) => (cur[id] ? { ...cur, [id]: false } : cur))
        }, REVEAL_MS)
      }
      return next
    })
  }

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: "POST" })
    } catch {
      /* ignore */
    }
    if (typeof onSessionExpired === "function") onSessionExpired()
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const { res, data: result } = await apiFetch('/password', {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (sessionLost(res)) return
      if (res.ok) {
        reset()
        toast(result?.message || "Password saved")
        fetchPasswords()
      } else {
        toast(result?.message || "Could not save password", "error")
      }
    } catch {
      toast("Cannot reach the server.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = async (id) => {
    const item = passwords.find((p) => p._id === id)
    if (!item) return
    try {
      await navigator.clipboard.writeText(item.password)
      setCopiedId(id)
      toast("Password copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast("Could not copy password", "error")
    }
  }

  const handleEdit = (p) => {
    setEditId(p._id)
    setShowEditInput(false)
    setEditData({ service: p.service, email: p.email, password: p.password })
  }

  const handleSaveEdit = async () => {
    if (!editData.service?.trim() || !editData.email?.trim() || !editData.password?.trim()) {
      toast("All fields are required", "error")
      return
    }
    setEditSaving(true)
    try {
      const { res, data: result } = await apiFetch(`/password/${editId}`, {
        method: "PATCH",
        body: JSON.stringify(editData),
      })
      if (sessionLost(res)) return
      if (res.ok) {
        toast(result?.message || "Changes saved")
        setEditId(null)
        setEditData({})
        fetchPasswords()
      } else {
        toast(result?.message || "Could not save changes", "error")
      }
    } catch {
      toast("Cannot reach the server.", "error")
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const item = passwords.find((p) => p._id === id)
    const name = item?.service || "this service"
    if (!window.confirm(`Delete the saved password for "${name}"? This cannot be undone.`)) {
      return
    }
    setDeletingId(id)
    try {
      const { res, data: result } = await apiFetch(`/password/${id}`, {
        method: "DELETE",
      })
      if (sessionLost(res)) return
      if (res.ok) {
        toast("Password deleted")
        fetchPasswords()
      } else {
        toast(result?.message || "Could not delete password", "error")
      }
    } catch {
      toast("Cannot reach the server.", "error")
    } finally {
      setDeletingId(null)
    }
  }

  const query = search.trim().toLowerCase()
  const filtered = query
    ? passwords.filter(
        (p) =>
          (p.service || "").toLowerCase().includes(query) ||
          (p.email || "").toLowerCase().includes(query)
      )
    : passwords

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="4" className="table-state">Loading passwords…</td>
        </tr>
      )
    }
    if (passwords.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="table-state">No passwords saved yet. Add one above!</td>
        </tr>
      )
    }
    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="table-state">No matches for “{search}”.</td>
        </tr>
      )
    }
    return filtered.map((p) => (
      <tr key={p._id}>
        {editId === p._id ? (
          <>
            <td>
              <input
                type="text"
                value={editData.service}
                onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                placeholder="Service"
              />
            </td>
            <td>
              <input
                type="text"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email / Username"
              />
            </td>
            <td>
              <div className="password-input">
                <input
                  type={showEditInput ? "text" : "password"}
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showEditInput ? "Hide password" : "Show password"}
                  onClick={() => setShowEditInput(!showEditInput)}
                >
                  {showEditInput ? <GoEye /> : <GoEyeClosed />}
                </button>
              </div>
            </td>
            <td className="actions">
              <button type="button" className="save-changes-btn" disabled={editSaving} onClick={handleSaveEdit}>
                {editSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setEditId(null)
                  setEditData({})
                }}
              >
                Exit
              </button>
            </td>
          </>
        ) : (
          <>
            <td>{p.service}</td>
            <td>{p.email}</td>
            <td>
              <div className="password-cell">
                <span className="password-dots">{visiblePasswords[p._id] ? p.password : "••••••••"}</span>
                <button
                  type="button"
                  className="icon-btn static"
                  aria-label={visiblePasswords[p._id] ? "Hide password" : "Show password"}
                  onClick={() => toggleVisibility(p._id)}
                >
                  {visiblePasswords[p._id] ? <GoEye /> : <GoEyeClosed />}
                </button>
                <button
                  type="button"
                  className="icon-btn static"
                  aria-label="Copy password"
                  onClick={() => handleCopy(p._id)}
                >
                  {copiedId === p._id ? <GoCheck /> : <GoCopy />}
                </button>
              </div>
            </td>
            <td className="actions">
              <button type="button" className="edit-btn" onClick={() => handleEdit(p)}>Edit</button>
              <button
                type="button"
                className="delete-btn"
                disabled={deletingId === p._id}
                onClick={() => handleDelete(p._id)}
              >
                {deletingId === p._id ? "Deleting…" : "Delete"}
              </button>
            </td>
          </>
        )}
      </tr>
    ))
  }

  return (
    <>
      <div className="dashboard-container">
        <nav className="navbar">
          <div className="logo">Vaultly</div>
          <div className="user-info">
            <span className="welcome">Welcome, {user || "friend"}</span>
            <button type="button" className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        <main className="main-content">
          <section className="add-password">
            <h2>Add New Password</h2>
            <form className="inputs-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <div className="field">
                  <input {...register("service")} placeholder="Service" disabled={saving} />
                  <p className="error">{errors.service?.message}</p>
                </div>
                <div className="field">
                  <input {...register("email")} type="email" placeholder="Email / Username" disabled={saving} />
                  <p className="error">{errors.email?.message}</p>
                </div>
                <div className="field">
                  <div className="password-input">
                    <input
                      {...register("password")}
                      type={showInput ? "text" : "password"}
                      placeholder="Password"
                      disabled={saving}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={showInput ? "Hide password" : "Show password"}
                      onClick={() => setShowInput(!showInput)}
                    >
                      {showInput ? <GoEye /> : <GoEyeClosed />}
                    </button>
                  </div>
                  <p className="error">{errors.password?.message}</p>
                </div>
              </div>
              <button className="save-btn" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Password"}
              </button>
            </form>
          </section>

          <section className="password-list">
            <div className="list-header">
              <h2>Saved Passwords</h2>
              <input
                className="search-box"
                type="search"
                placeholder="Search service or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search saved passwords"
              />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Email/Username</th>
                    <th>Password</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>{renderTableBody()}</tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export default Dashboard