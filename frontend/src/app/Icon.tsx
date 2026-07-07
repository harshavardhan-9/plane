interface Props {
  path: string
  size?: number
  sw?: number
  fill?: boolean
}

// Single-path line icon, matching the design's inline SVG pattern.
export default function Icon({ path, size = 16, sw = 1.7, fill = false }: Props) {
  return (
    <span style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
      <svg
        viewBox="0 0 24 24"
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '100%', height: '100%' }}
      >
        <path d={path} />
      </svg>
    </span>
  )
}
