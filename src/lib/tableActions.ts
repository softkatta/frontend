import type { LucideIcon } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import type { TableActionItem } from '@/components/common/TableActions'

export function actionBtn(label: string, icon: LucideIcon, onClick?: () => void): TableActionItem {
  return {
    label,
    icon,
    onClick: onClick ?? (() => toast({ title: label })),
  }
}
