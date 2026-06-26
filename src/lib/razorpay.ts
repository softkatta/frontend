type RazorpayHandlerResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  handler?: (response: RazorpayHandlerResponse) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, handler: () => void) => void
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

export function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpayHandlerResponse> {
  return loadRazorpayScript().then(
    () =>
      new Promise((resolve, reject) => {
        if (!window.Razorpay) {
          reject(new Error('Razorpay is not available'))
          return
        }

        const instance = new window.Razorpay({
          ...options,
          handler: (response) => resolve(response),
          modal: {
            ...options.modal,
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        })

        instance.on('payment.failed', () => reject(new Error('Payment failed')))
        instance.open()
      }),
  )
}
