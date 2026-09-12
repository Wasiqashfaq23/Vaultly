import "./Dashboard.css"
import { GoEye, GoEyeClosed, GoCopy, GoCheck, GoPencil, GoTrash, GoKey, GoShield, GoX } from "react-icons/go"
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { apiFetch } from '../../src/api'
import { toast } from '../../src/toast'
import { generatePassword, passwordScore, strengthLabel } from '../../src/password'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const schema = yup.object({
  service: yup.string().trim().required("Service is required"),
  email: yup.string().trim().required("Email is required").email("Enter a valid email"),
  password: yup.string().required("Password is required"),
}).required()

const REVEAL_MS = 10000
const CLIPBOARD_CLEAR_MS = 30000

const Dashboard = ({ onSessionExpired }) => {
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [passwords, setpasswords] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showInput, setShowInput] = useState(false)
  const [showEditInput, setShowEditInput] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const clipboardClearRef = useRef(null)
  const serviceInputRef = useRef(null)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const addPasswordValue = watch("password") || ""
  const addScore = passwordScore(addPasswordValue)

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

  useEffect(() => {
    fetchPasswords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (clipboardClearRef.current) clearTimeout(clipboardClearRef.current)
    }
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
        setShowInput(false)
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
      if (clipboardClearRef.current) clearTimeout(clipboardClearRef.current)
      clipboardClearRef.current = setTimeout(() => {
        navigator.clipboard.writeText("").catch(() => {})
      }, CLIPBOARD_CLEAR_MS)
    } catch {
      toast("Could not copy password", "error")
    }
  }

  const handleGenerate = () => {
    const gen = generatePassword()
    setValue("password", gen, { shouldValidate: true })
    setShowInput(true)
    toast("Strong password generated")
  }

  const handleGenerateEdit = () => {
    setEditData((prev) => ({ ...prev, password: generatePassword() }))
    setShowEditInput(true)
    toast("Strong password generated")
  }

  const handleEdit = (p) => {
    setEditId(p._id)
    setConfirmId(null)
    setShowEditInput(false)
    setEditData({ service: p.service, email: p.email, password: p.password })
  }

  const editError = editId
    ? !editData.service?.trim()
      ? "Service is required"
      : !editData.email?.trim()
        ? "Email is required"
        : !EMAIL_REGEX.test(editData.email.trim())
          ? "Enter a valid email"
          : !editData.password
            ? "Password is required"
            : ""
    : ""

  const handleSaveEdit = async () => {
    if (editError) {
      toast(editError, "error")
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
    setDeletingId(id)
    try {
      const { res, data: result } = await apiFetch(`/password/${id}`, {
        method: "DELETE",
      })
      if (sessionLost(res)) return
      if (res.ok) {
        toast(`Password for "${name}" deleted`)
        setConfirmId(null)
        fetchPasswords()
      } else {
        toast(result?.message || "Could not delete password", "error")
        setConfirmId(null)
      }
    } catch {
      toast("Cannot reach the server.", "error")
      setConfirmId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const focusAddField = () => {
    setShowInput(false)
    requestAnimationFrame(() => serviceInputRef.current?.focus())
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
        <>
          {[0, 1, 2].map((i) => (
            <tr key={i} className="skeleton-row">
              <td><span className="skeleton-bar" style={{ width: "40%" }} /></td>
              <td><span className="skeleton-bar" style={{ width: "60%" }} /></td>
              <td><span className="skeleton-bar" style={{ width: "45%" }} /></td>
              <td><span className="skeleton-bar" style={{ width: "70%" }} /></td>
            </tr>
          ))}
        </>
      )
    }
    if (passwords.length === 0) {
      return (
        <tr>
          <td colSpan="4" className="table-state">
            <div className="empty-state">
              <GoShield className="empty-icon" aria-hidden="true" />
              <p className="empty-title">No passwords saved yet</p>
              <p className="empty-sub">Store your first login and we’ll keep it safe for you.</p>
              <button type="button" className="empty-cta" onClick={focusAddField}>
                Add your first password
              </button>
            </div>
          </td>
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
      <tr key={p._id} className={editId === p._id ? "editing-row" : ""}>
        {editId === p._id ? (
          <>
            <td data-label="Service">
              <input
                type="text"
                aria-label="Service"
                aria-invalid={Boolean(editError && !editData.service?.trim())}
                value={editData.service}
                onChange={(e) => setEditData({ ...editData, service: e.target.value })}
                placeholder="Service"
              />
            </td>
            <td data-label="Email">
              <input
                type="text"
                aria-label="Email"
                aria-invalid={Boolean(editError && (!editData.email?.trim() || !EMAIL_REGEX.test(editData.email.trim())))}
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                placeholder="Email"
              />
            </td>
            <td data-label="Password">
              <div className="password-input with-gen">
                <input
                  type={showEditInput ? "text" : "password"}
                  aria-label="Password"
                  aria-invalid={Boolean(editError && !editData.password)}
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="icon-btn gen-btn"
                  aria-label="Generate strong password"
                  title="Generate password"
                  onClick={handleGenerateEdit}
                >
                  <GoKey />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showEditInput ? "Hide password" : "Show password"}
                  onClick={() => setShowEditInput(!showEditInput)}
                >
                  {showEditInput ? <GoEye /> : <GoEyeClosed />}
                </button>
              </div>
              {editError && <p className="error">{editError}</p>}
            </td>
            <td className="actions" data-label="Actions">
              <button type="button" className="save-changes-btn" disabled={editSaving || Boolean(editError)} onClick={handleSaveEdit}>
                {editSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                aria-label="Cancel editing"
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
            <td data-label="Service">{p.service}</td>
            <td data-label="Email">{p.email}</td>
            <td data-label="Password">
              <div className="password-cell">
                <span className="password-dots">{visiblePasswords[p._id] ? p.password : "••••••••"}</span>
                <button
                  type="button"
                  className="icon-btn static"
                  aria-label={visiblePasswords[p._id] ? "Hide password" : "Show password"}
                  title={visiblePasswords[p._id] ? "Hide password" : "Show password"}
                  onClick={() => toggleVisibility(p._id)}
                >
                  {visiblePasswords[p._id] ? <GoEye /> : <GoEyeClosed />}
                </button>
                <button
                  type="button"
                  className="icon-btn static"
                  aria-label="Copy password"
                  title="Copy to clipboard"
                  onClick={() => handleCopy(p._id)}
                >
                  {copiedId === p._id ? <GoCheck /> : <GoCopy />}
                </button>
              </div>
            </td>
            <td className="actions" data-label="Actions">
              {confirmId === p._id ? (
                <div className="confirm-bar">
                  <span className="confirm-text">Delete anyway?</span>
                  <button
                    type="button"
                    className="confirm-yes"
                    disabled={deletingId === p._id}
                    onClick={() => handleDelete(p._id)}
                  >
                    {deletingId === p._id ? "Deleting…" : "Delete"}
                  </button>
                  <button type="button" className="confirm-no" onClick={() => setConfirmId(null)}>
                    Keep
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="action-btn"
                    aria-label={`Edit password for ${p.service}`}
                    title="Edit"
                    onClick={() => handleEdit(p)}
                  >
                    <GoPencil />
                  </button>
                  <button
                    type="button"
                    className="action-btn danger"
                    aria-label={`Delete password for ${p.service}`}
                    title="Delete"
                    disabled={deletingId === p._id}
                    onClick={() => setConfirmId(p._id)}
                  >
                    <GoTrash />
                  </button>
                </>
              )}
            </td>
          </>
        )}
      </tr>
    ))
  }

  return (
    <div className="dashboard-container">
      <main className="main-content">
        <section className="add-password">
          <h2>Add New Password</h2>
          <form className="inputs-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="fields-row">
              <div className="field">
                <label htmlFor="add-service">Service</label>
                <input
                  id="add-service"
                  ref={serviceInputRef}
                  {...register("service")}
                  placeholder="e.g. GitHub"
                  disabled={saving}
                  aria-invalid={Boolean(errors.service)}
                  aria-describedby={errors.service ? "add-service-error" : undefined}
                />
                <p className="error" id="add-service-error">{errors.service?.message}</p>
              </div>
              <div className="field">
                <label htmlFor="add-email">Email</label>
                <input
                  id="add-email"
                  {...register("email")}
                  type="email"
                  placeholder="Email"
                  disabled={saving}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "add-email-error" : undefined}
                />
                <p className="error" id="add-email-error">{errors.email?.message}</p>
              </div>
              <div className="field">
                <label htmlFor="add-password">Password</label>
                <div className="password-input with-gen">
                  <input
                    id="add-password"
                    {...register("password")}
                    type={showInput ? "text" : "password"}
                    placeholder="Password"
                    disabled={saving}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "add-password-error" : undefined}
                  />
                  <button
                    type="button"
                    className="icon-btn gen-btn"
                    aria-label="Generate strong password"
                    title="Generate strong password"
                    onClick={handleGenerate}
                    disabled={saving}
                  >
                    <GoKey />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={showInput ? "Hide password" : "Show password"}
                    onClick={() => setShowInput(!showInput)}
                  >
                    {showInput ? <GoEye /> : <GoEyeClosed />}
                  </button>
                </div>
                {!errors.password?.message && addPasswordValue && (
                  <div className="strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className={`bar ${i <= addScore ? `filled-${addScore}` : ""}`} />
                      ))}
                    </div>
                    <span className={`strength-label s-${addScore}`}>
                      {strengthLabel(addScore)} password
                    </span>
                  </div>
                )}
                <p className="error" id="add-password-error">{errors.password?.message}</p>
              </div>
              <div className="save-cell">
                <button className="save-btn" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Password"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="password-list">
          <div className="list-header">
            <h2>Saved Passwords</h2>
            <div className="search-wrap">
              <input
                className="search-box"
                type="search"
                placeholder="Search service or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search saved passwords"
              />
              {search && (
                <button
                  type="button"
                  className="clear-search"
                  aria-label="Clear search"
                  title="Clear search"
                  onClick={() => setSearch("")}
                >
                  <GoX />
                </button>
              )}
            </div>
          </div>
          <div className="table-wrap">
            <table className="passwords-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Email</th>
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
  )
}

export default Dashboard