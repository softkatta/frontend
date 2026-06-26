export function buildUpiPaymentUrl(params: {
  vpa: string
  payeeName: string
  amount: number
  note: string
  currency?: string
}): string {
  const query = new URLSearchParams()
  query.set('pa', params.vpa.trim())
  query.set('pn', params.payeeName.trim())
  query.set('am', params.amount.toFixed(2))
  query.set('cu', params.currency ?? 'INR')
  query.set('tn', params.note.trim())
  return `upi://pay?${query.toString()}`
}
