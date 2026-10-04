import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrCode({ value, size = 96, className = '' }) {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let active = true
    QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#002E6E', light: '#FFFFFF' } })
      .then((url) => { if (active) setSrc(url) })
      .catch(() => {})
    return () => { active = false }
  }, [value, size])

  return src
    ? <img src={src} alt="QR code with document details" width={size} height={size} className={className} />
    : <span style={{ width: size, height: size }} className={`inline-block bg-[#eef2f7] ${className}`} />
}
