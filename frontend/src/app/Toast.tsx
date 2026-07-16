import { useEffect } from 'react'
import Icon from './Icon'
import { ICONS } from './data'

interface Props {
  message: string
  onDismiss: () => void
}

export default function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 380, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-overlay-200)' }}>
      <span style={{ display: 'inline-flex', width: 15, height: 15, color: 'var(--danger-text)', flexShrink: 0 }}>
        <Icon path={ICONS.alert} size={15} sw={2} />
      </span>
      <span style={{ fontSize: 13, color: 'var(--txt-primary)', flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onDismiss} className="hov-layer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--txt-tertiary)', cursor: 'pointer', flexShrink: 0 }}>
        <Icon path={ICONS.close} size={12} sw={2} />
      </button>
    </div>
  )
}
