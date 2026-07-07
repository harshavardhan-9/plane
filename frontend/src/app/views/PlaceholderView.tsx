import Icon from '../Icon'

interface Props {
  title: string
  desc: string
  iconPath: string
}

export default function PlaceholderView({ title, desc, iconPath }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 360, textAlign: 'center', padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--bg-layer-1)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt-placeholder)', marginBottom: 6 }}>
          <Icon path={iconPath} size={24} sw={1.5} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--txt-primary)' }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}
