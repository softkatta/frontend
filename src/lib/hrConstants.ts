export const APPLICATION_STATUSES = [

  { value: 'applied', label: 'Applied' },

  { value: 'shortlisted', label: 'Shortlisted' },

  { value: 'interview_scheduled', label: 'Interview Scheduled' },

  { value: 'selected', label: 'Selected' },

  { value: 'rejected', label: 'Rejected' },

  { value: 'joined', label: 'Joined' },

] as const



/** Stage 1 — Interview / application (public apply form) */

export const APPLICATION_DOCUMENTS = [

  { key: 'resume', label: 'Resume (CV)', required: true },

  { key: 'photo', label: 'Passport size photo', required: false },

  { key: 'aadhaar', label: 'Aadhaar card', required: false },

  { key: 'pan', label: 'PAN card', required: false },

  { key: 'education_certificates', label: 'Educational certificates', required: false },

  {

    key: 'experience_certificates',

    label: 'Experience certificate',

    required: false,

    hint: 'Upload if you are an experienced candidate',

  },

  {

    key: 'salary_slips',

    label: 'Last 3 months salary slips',

    required: false,

    hint: 'For experienced candidates',

  },

  {

    key: 'bank_proof',

    label: 'Bank details (passbook / cancelled cheque)',

    required: false,

  },

] as const



export type ApplicationDocumentKey = (typeof APPLICATION_DOCUMENTS)[number]['key']



export const EMPLOYEE_STATUSES = [

  { value: 'active', label: 'Active' },

  { value: 'probation', label: 'Probation' },

  { value: 'on_notice', label: 'On notice' },

  { value: 'exited', label: 'Exited' },

] as const



export const EXIT_STATUSES = [

  { value: 'initiated', label: 'Initiated' },

  { value: 'acceptance_sent', label: 'Resignation acceptance sent' },

  { value: 'exit_interview', label: 'Exit interview' },

  { value: 'no_dues', label: 'No dues clearance' },

  { value: 'asset_handover', label: 'Asset handover' },

  { value: 'full_and_final', label: 'Full & final settlement' },

  { value: 'completed', label: 'Completed' },

] as const



/** Stage 2 — Joining documents (HR upload after selection) */
export const JOINING_DOC_CATEGORIES = [
  { value: 'offer_letter', label: 'Offer letter (Company provides)', providedBy: 'company' },
  { value: 'appointment_letter', label: 'Appointment letter (Company provides)', providedBy: 'company' },
  { value: 'joining_form', label: 'Joining form (Company provides)', providedBy: 'company' },
  { value: 'aadhaar', label: 'ID proof — Aadhaar (Employee submits)', providedBy: 'employee' },
  { value: 'pan', label: 'ID proof — PAN (Employee submits)', providedBy: 'employee' },
  { value: 'address_proof', label: 'Address proof (Employee submits)', providedBy: 'employee' },
  { value: 'education', label: 'Educational documents (Employee submits)', providedBy: 'employee' },
  { value: 'experience', label: 'Previous experience / relieving letter (Employee submits)', providedBy: 'employee' },
  { value: 'photo', label: 'Passport size photos (Employee submits)', providedBy: 'employee' },
  { value: 'bank_proof', label: 'Cancelled cheque / bank passbook (Employee submits)', providedBy: 'employee' },
  { value: 'pf_uan_document', label: 'UAN / PF details (Employee submits)', providedBy: 'employee' },
  { value: 'esic_document', label: 'ESIC details (Employee submits)', providedBy: 'employee' },
  { value: 'nda', label: 'NDA / confidentiality agreement (Company provides)', providedBy: 'company' },
  { value: 'declaration', label: 'Employee declaration form (Company provides)', providedBy: 'company' },
  { value: 'id_card', label: 'Employee ID card (Company provides)', providedBy: 'company' },
] as const

/** Stage 3 — During employment (HR-managed in admin) */
export const EMPLOYMENT_DOC_CATEGORIES = [
  { value: 'performance_review', label: 'Appraisal / performance form (Company provides)', providedBy: 'company' },
  { value: 'promotion', label: 'Promotion letter (Company provides)', providedBy: 'company' },
  { value: 'increment_letter', label: 'Increment letter (Company provides)', providedBy: 'company' },
  { value: 'transfer_letter', label: 'Transfer letter (Company provides)', providedBy: 'company' },
  { value: 'warning', label: 'Warning letter (Company provides)', providedBy: 'company' },
  { value: 'training', label: 'Training certificates (Company provides)', providedBy: 'company' },
  { value: 'salary_revision', label: 'Salary revision letter (Company provides)', providedBy: 'company' },
] as const

/** Employee self-service (employee portal only) */
export const EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES = [
  { value: 'leave_application', label: 'Leave application (Employee submits)', providedBy: 'employee' },
  { value: 'attendance_records', label: 'Attendance records (Employee submits)', providedBy: 'employee' },
] as const

/** Stage 4 — Resignation / exit */
export const EXIT_DOC_CATEGORIES = [
  { value: 'resignation_form', label: 'Resignation letter (Employee submits)', providedBy: 'employee' },
  { value: 'resignation_acceptance', label: 'Resignation acceptance letter (Company provides)', providedBy: 'company' },
  { value: 'no_dues', label: 'No dues form (Company provides)', providedBy: 'company' },
  { value: 'asset_handover', label: 'Asset handover form (Company provides)', providedBy: 'company' },
  { value: 'exit_interview', label: 'Exit interview form (Company provides)', providedBy: 'company' },
  { value: 'full_and_final', label: 'Full & final settlement (Company provides)', providedBy: 'company' },
  { value: 'experience_letter', label: 'Experience letter (Company provides)', providedBy: 'company' },
  { value: 'relieving_letter', label: 'Relieving letter (Company provides)', providedBy: 'company' },
  { value: 'form_16', label: 'Form 16 — income tax (Company provides)', providedBy: 'company' },
  { value: 'pf_gratuity', label: 'PF / gratuity documents (Company provides)', providedBy: 'company' },
] as const



export type EmployeeDocCategory =

  | (typeof JOINING_DOC_CATEGORIES)[number]['value']

  | (typeof EMPLOYMENT_DOC_CATEGORIES)[number]['value']

  | (typeof EXIT_DOC_CATEGORIES)[number]['value']



export const EMPLOYEE_DOC_STAGES = [

  { stage: 'joining', title: 'Joining documents', categories: JOINING_DOC_CATEGORIES },

  { stage: 'employment', title: 'During employment', categories: EMPLOYMENT_DOC_CATEGORIES },

] as const



/** Joining + employment — used for employee document upload in admin */

export const EMPLOYEE_DOC_CATEGORIES = [

  ...JOINING_DOC_CATEGORIES,

  ...EMPLOYMENT_DOC_CATEGORIES,

] as const



const APPLICATION_DOC_LABELS = Object.fromEntries(

  APPLICATION_DOCUMENTS.map((doc) => [doc.key, doc.label]),

) as Record<string, string>



const ALL_EMPLOYEE_DOC_LABELS = Object.fromEntries([
  ...JOINING_DOC_CATEGORIES,
  ...EMPLOYMENT_DOC_CATEGORIES,
  ...EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES,
  ...EXIT_DOC_CATEGORIES,
].map((doc) => [doc.value, doc.label])) as Record<string, string>



export function getApplicationDocumentLabel(type: string): string {

  return APPLICATION_DOC_LABELS[type] ?? type.replace(/_/g, ' ')

}



export function getEmployeeDocumentLabel(category: string): string {

  return ALL_EMPLOYEE_DOC_LABELS[category] ?? category.replace(/_/g, ' ')

}



export function getEmployeeDocumentStage(category: string): 'joining' | 'employment' | 'exit' | 'self_service' | 'other' {
  if (JOINING_DOC_CATEGORIES.some((doc) => doc.value === category)) return 'joining'
  if (EMPLOYEE_SELF_SERVICE_DOC_CATEGORIES.some((doc) => doc.value === category)) return 'self_service'
  if (EMPLOYMENT_DOC_CATEGORIES.some((doc) => doc.value === category)) return 'employment'
  if (EXIT_DOC_CATEGORIES.some((doc) => doc.value === category)) return 'exit'
  return 'other'
}



export const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual leave' },
  { value: 'sick', label: 'Sick leave' },
  { value: 'earned', label: 'Earned leave' },
  { value: 'unpaid', label: 'Unpaid leave' },
  { value: 'other', label: 'Other' },
] as const

export const LEAVE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export const ATTENDANCE_STATUSES = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

export const WORK_MODES = [
  { value: 'office', label: 'Office' },
  { value: 'wfh', label: 'Work from home' },
  { value: 'field', label: 'Field visit' },
] as const

export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export const COMPANY_ROLE_CATEGORIES = [
  'Leadership',
  'Engineering & Delivery',
  'Design',
  'Quality & Infrastructure',
  'Business & Analysis',
  'Sales & Marketing',
  'Customer & Support',
  'Human Resources',
  'Finance & Accounts',
  'Administration',
  'Internship',
] as const

export const EMPLOYEE_PORTAL_MENU_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'profile', label: 'My profile' },
  { key: 'leave', label: 'Leave application' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'documents', label: 'Documents' },
  { key: 'resignation', label: 'Resignation' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'tasks', label: 'My Tasks' },
  { key: 'projects', label: 'My Projects' },
  { key: 'timesheets', label: 'Timesheets' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'assets', label: 'Assets' },
  { key: 'training', label: 'Training' },
  { key: 'performance', label: 'Performance Reviews' },
  { key: 'helpdesk', label: 'Help Desk' },
] as const

export type EmployeePortalMenuKey = (typeof EMPLOYEE_PORTAL_MENU_OPTIONS)[number]['key']

/** Default menus for every company role (full employee portal catalog). */
export const EMPLOYEE_PORTAL_CORE_KEYS: EmployeePortalMenuKey[] = [
  'dashboard',
  'profile',
  'leave',
  'attendance',
  'documents',
  'resignation',
  'notifications',
  'tasks',
  'projects',
  'timesheets',
  'calendar',
  'announcements',
  'assets',
  'training',
  'performance',
  'helpdesk',
]

export function defaultEmployeePortalMenus(category: string, slug?: string): EmployeePortalMenuKey[] {
  // Full catalog by default for every company role.
  const core = EMPLOYEE_PORTAL_MENU_OPTIONS.map((option) => option.key)

  if (slug === 'intern-trainee' || category === 'Internship') {
    return core.filter((key) => key !== 'resignation')
  }

  if (category === 'Administration') {
    return core.filter((key) => key !== 'resignation')
  }

  return core
}

