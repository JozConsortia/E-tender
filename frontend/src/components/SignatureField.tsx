export const SIGNATURE_FONTS = [
  { family: "'Dancing Script', cursive", label: 'Style 1' },
  { family: "'Great Vibes', cursive", label: 'Style 2' },
  { family: "'Sacramento', cursive", label: 'Style 3' },
]

export function signatureFontFamily(style?: number) {
  return SIGNATURE_FONTS[style ?? 0]?.family ?? SIGNATURE_FONTS[0].family
}

interface SignatureFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  style: number
  onStyleChange: (style: number) => void
  disabled?: boolean
}

export function SignatureField({ label, value, onChange, style, onStyleChange, disabled }: SignatureFieldProps) {
  return (
    <div className="signature-field">
      <label>{label}<input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder="Type your full name to generate a signature" /></label>
      {value.trim() && <>
        <div className="signature-preview" style={{ fontFamily: signatureFontFamily(style) }}>{value}</div>
        <div className="signature-style-picker">
          <span className="muted">Choose your signature style:</span>
          <div className="signature-style-row">
            {SIGNATURE_FONTS.map((font, index) => (
              <button
                key={font.label}
                type="button"
                className={index === style ? 'signature-style active' : 'signature-style'}
                style={{ fontFamily: font.family }}
                onClick={() => onStyleChange(index)}
                disabled={disabled}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </>}
    </div>
  )
}
