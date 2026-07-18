import { useCallback, useEffect, useRef, useState } from 'react'
import { siteApi } from '@/services/api/modules/site.api'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const SCRIPT_ID = 'recaptcha-v3'

export function useRecaptcha(defaultAction = 'submit') {
  const [enabled, setEnabled] = useState(false)
  const [siteKey, setSiteKey] = useState('')
  const loadingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    void siteApi.captchaConfig().then((cfg) => {
      if (cancelled || !cfg.enabled || !cfg.site_key) return
      setEnabled(true)
      setSiteKey(cfg.site_key)
      if (!document.getElementById(SCRIPT_ID) && !loadingRef.current) {
        loadingRef.current = true
        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.src = `https://www.google.com/recaptcha/api.js?render=${cfg.site_key}`
        script.async = true
        document.head.appendChild(script)
      }
    }).catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  const getToken = useCallback(async (action = defaultAction): Promise<string | undefined> => {
    if (!enabled || !siteKey || !window.grecaptcha) return undefined

    return new Promise((resolve) => {
      window.grecaptcha!.ready(() => {
        window.grecaptcha!
          .execute(siteKey, { action })
          .then(resolve)
          .catch(() => resolve(undefined))
      })
    })
  }, [defaultAction, enabled, siteKey])

  return { enabled, siteKey, getToken }
}
