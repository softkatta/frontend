import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { buildUpiPaymentUrl } from '@/lib/upiQr'

type PaymentQrProps = {
  payload?: string
  vpa?: string
  payeeName: string
  amount: number
  note: string
  currency?: string
  className?: string
}

export function PaymentQr({
  payload,
  vpa,
  payeeName,
  amount,
  note,
  currency,
  className,
}: PaymentQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const upiPayload =
      payload ??
      (vpa
        ? buildUpiPaymentUrl({ vpa, payeeName, amount, note, currency })
        : null)

    if (!upiPayload) {
      setDataUrl(null)
      return
    }

    let active = true
    QRCode.toDataURL(upiPayload, { width: 160, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setDataUrl(null)
      })

    return () => {
      active = false
    }
  }, [payload, vpa, payeeName, amount, note, currency])

  if (!dataUrl) return null

  return (
    <div className={className}>
      <div className="inline-flex flex-col items-center rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm">
        <img src={dataUrl} alt="Scan to pay via UPI" className="h-36 w-36 object-contain" />
        <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
          Scan to Pay
        </p>
        <p className="mt-0.5 text-center text-[10px] text-[var(--muted-foreground)]">
          UPI QR · {payeeName}
        </p>
      </div>
    </div>
  )
}
