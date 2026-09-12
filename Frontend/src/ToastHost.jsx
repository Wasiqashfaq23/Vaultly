import { useEffect, useState } from "react"
import { subscribeToast } from "./toast"
import "./toast.css"

const ToastHost = () => {
  const [items, setItems] = useState([])

  useEffect(
    () =>
      subscribeToast((update) => {
        setItems((prev) =>
          update.dismiss ? prev.filter((t) => t.id !== update.id) : [...prev, update]
        )
      }),
    []
  )

  if (items.length === 0) return null

  return (
    <div className="toast-host">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastHost