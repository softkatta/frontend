import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePublicProducts } from '@/hooks/usePublicProducts'
import type { ChatbotLeadFormType, ChatbotLeadFormValues } from '@/types/chatbot'

interface LeadFormProps {
  formType: ChatbotLeadFormType
  fields: string[]
  onSubmit: (values: Partial<ChatbotLeadFormValues>) => Promise<void>
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  phone: 'Mobile Number',
  email: 'Email',
  company_name: 'Company Name',
  product: 'Interested Product',
  preferred_datetime: 'Preferred Date & Time',
  message: 'Details',
}

const EXTRA_PRODUCT_OPTIONS = [
  { value: 'Custom Software Development', label: 'Custom Software Development' },
  { value: 'Not sure yet', label: 'Not sure yet' },
]

export function LeadForm({ formType, fields, onSubmit }: LeadFormProps) {
  const { products, loading: productsLoading } = usePublicProducts()
  const [values, setValues] = useState<ChatbotLeadFormValues>({
    name: '',
    phone: '',
    email: '',
    company_name: '',
    product: '',
    preferred_datetime: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const productOptions = useMemo(() => {
    const fromApi = products
      .filter((p) => p.is_active)
      .map((p) => ({ value: p.name, label: p.name }))
    return [...fromApi, ...EXTRA_PRODUCT_OPTIONS]
  }, [products])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload: Partial<ChatbotLeadFormValues> = {}
      for (const field of fields) {
        const key = field as keyof ChatbotLeadFormValues
        if (values[key]) payload[key] = values[key]
      }
      if (formType === 'technical_support') {
        payload.message = values.message || `Product: ${values.product}`
      } else {
        payload.message = values.message || `Preferred: ${values.preferred_datetime}`
      }
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: string) => {
    const key = field as keyof ChatbotLeadFormValues
    const required = ['name', 'phone'].includes(field) || (formType === 'book_demo' && field === 'email')

    if (field === 'message') {
      return (
        <textarea
          id={`chatbot-${field}`}
          className="chatbot-lead-form__textarea"
          value={values.message}
          onChange={(e) => setValues((prev) => ({ ...prev, message: e.target.value }))}
          rows={3}
        />
      )
    }

    if (field === 'product') {
      return (
        <select
          id={`chatbot-${field}`}
          className="chatbot-lead-form__select"
          value={values.product}
          required={required}
          disabled={productsLoading && productOptions.length === 0}
          onChange={(e) => setValues((prev) => ({ ...prev, product: e.target.value }))}
        >
          <option value="">
            {productsLoading ? 'Loading products…' : 'Select a product'}
          </option>
          {productOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    return (
      <Input
        id={`chatbot-${field}`}
        className="chatbot-lead-form__input"
        type={field === 'email' ? 'email' : field.includes('datetime') ? 'datetime-local' : 'text'}
        value={values[key] ?? ''}
        required={required}
        onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
      />
    )
  }

  return (
    <form className="chatbot-lead-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field} className="chatbot-lead-form__field">
          <Label htmlFor={`chatbot-${field}`}>{FIELD_LABELS[field] ?? field}</Label>
          {renderField(field)}
        </div>
      ))}
      <Button type="submit" disabled={submitting} className="chatbot-lead-form__submit w-full">
        {submitting ? 'Submitting…' : 'Submit'}
      </Button>
    </form>
  )
}
