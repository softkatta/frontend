import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouteHydrateFallback } from '@/components/common/RouteHydrateFallback'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { MaintenanceGate } from '@/routes/MaintenanceGate'

type PageModule = { default: ComponentType }

function lazyPage(importFn: () => Promise<PageModule>) {
  return async () => {
    const mod = await importFn()
    return { Component: mod.default, HydrateFallback: RouteHydrateFallback }
  }
}

export const router = createBrowserRouter([
  {
    id: 'root',
    element: <MaintenanceGate />,
    HydrateFallback: RouteHydrateFallback,
    children: [
      {
        element: <PublicLayout />,
        HydrateFallback: RouteHydrateFallback,
        children: [
          { index: true, lazy: lazyPage(() => import('@/pages/public/HomePage')) },
          { path: 'products', lazy: lazyPage(() => import('@/pages/public/ProductsPage')) },
          { path: 'products/:slug', lazy: lazyPage(() => import('@/pages/public/ProductDetailPage')) },
          { path: 'services', lazy: lazyPage(() => import('@/pages/public/ServicesPage')) },
          { path: 'services/:slug', lazy: lazyPage(() => import('@/pages/public/ServiceDetailPage')) },
          { path: 'pricing', lazy: lazyPage(() => import('@/pages/public/PricingPage')) },
          { path: 'about', lazy: lazyPage(() => import('@/pages/public/AboutPage')) },
          { path: 'contact', lazy: lazyPage(() => import('@/pages/public/ContactPage')) },
          { path: 'reviews/write', lazy: lazyPage(() => import('@/pages/public/WriteReviewPage')) },
          { path: 'faq', lazy: lazyPage(() => import('@/pages/public/FaqPage')) },
          { path: 'privacy', lazy: lazyPage(() => import('@/pages/public/PrivacyPage')) },
          { path: 'terms', lazy: lazyPage(() => import('@/pages/public/TermsPage')) },
          { path: 'blog', lazy: lazyPage(() => import('@/pages/public/BlogPage')) },
          { path: 'blog/:slug', lazy: lazyPage(() => import('@/pages/public/BlogDetailPage')) },
          { path: 'careers', lazy: lazyPage(() => import('@/pages/public/CareersPage')) },
          { path: 'careers/:slug/apply', lazy: lazyPage(() => import('@/pages/public/CareerApplyPage')) },
          { path: 'careers/:slug', lazy: lazyPage(() => import('@/pages/public/CareerDetailPage')) },
          { path: 'cart', lazy: lazyPage(() => import('@/pages/public/CartPage')) },
          { path: 'checkout', lazy: lazyPage(() => import('@/pages/public/CheckoutPage')) },
          { path: 'checkout/success', lazy: lazyPage(() => import('@/pages/public/CheckoutSuccessPage')) },
          { path: 'register', lazy: lazyPage(() => import('@/pages/public/RegisterPage')) },
        ],
      },
      { path: 'login', lazy: lazyPage(() => import('@/pages/public/LoginPage')) },
      {
        path: 'dashboard',
        lazy: async () => {
          const [{ ProtectedRoute }, { ClientLayout }] = await Promise.all([
            import('./ProtectedRoute'),
            import('@/components/layout/ClientLayout'),
          ])
          return {
            element: (
              <ProtectedRoute allowedRoles={['client']}>
                <ClientLayout />
              </ProtectedRoute>
            ),
            HydrateFallback: RouteHydrateFallback,
          }
        },
        children: [
          { index: true, lazy: lazyPage(() => import('@/pages/client/DashboardPage')) },
          { path: 'orders', lazy: lazyPage(() => import('@/pages/client/ClientOrdersPage')) },
          { path: 'products', element: <Navigate to="/dashboard/orders" replace /> },
          { path: 'subscriptions', lazy: lazyPage(() => import('@/pages/client/SubscriptionsPage')) },
          { path: 'licenses', lazy: lazyPage(() => import('@/pages/client/LicensesPage')) },
          { path: 'invoices', lazy: lazyPage(() => import('@/pages/client/InvoicesPage')) },
          { path: 'invoices/:id', lazy: lazyPage(() => import('@/pages/client/ClientInvoiceViewPage')) },
          { path: 'notifications', lazy: lazyPage(() => import('@/pages/client/NotificationsPage')) },
          { path: 'support', lazy: lazyPage(() => import('@/pages/client/SupportPage')) },
          { path: 'profile', lazy: lazyPage(() => import('@/pages/client/ProfilePage')) },
          { path: 'change-password', lazy: lazyPage(() => import('@/pages/account/ChangePasswordPage')) },
          { path: 'security', lazy: lazyPage(() => import('@/pages/account/SecurityPage')) },
        ],
      },
      {
        path: 'admin',
        children: [
          { index: true, lazy: lazyPage(() => import('@/pages/admin/AdminEntry')) },
          {
            lazy: async () => {
              const { AdminProtectedLayout } = await import('./AdminProtectedLayout')
              return {
                element: <AdminProtectedLayout />,
                HydrateFallback: RouteHydrateFallback,
              }
            },
            children: [
              { path: 'products', lazy: lazyPage(() => import('@/pages/admin/ProductsManagement')) },
              { path: 'categories', lazy: lazyPage(() => import('@/pages/admin/CategoriesManagement')) },
              { path: 'plans', lazy: lazyPage(() => import('@/pages/admin/PlansManagement')) },
              { path: 'coupons', lazy: lazyPage(() => import('@/pages/admin/CouponsManagement')) },
              { path: 'tenants', lazy: lazyPage(() => import('@/pages/admin/TenantsManagement')) },
              { path: 'customers', lazy: lazyPage(() => import('@/pages/admin/CustomersPage')) },
              { path: 'users', lazy: lazyPage(() => import('@/pages/admin/UsersPage')) },
              { path: 'subscriptions', lazy: lazyPage(() => import('@/pages/admin/SubscriptionsManagement')) },
              { path: 'licenses', lazy: lazyPage(() => import('@/pages/admin/LicensesManagement')) },
              { path: 'product-integrations', lazy: lazyPage(() => import('@/pages/admin/ProductIntegrationsManagement')) },
              { path: 'invoices', lazy: lazyPage(() => import('@/pages/admin/InvoicesManagement')) },
              { path: 'invoices/:id', lazy: lazyPage(() => import('@/pages/admin/AdminInvoiceViewPage')) },
              { path: 'orders', lazy: lazyPage(() => import('@/pages/admin/OrdersPage')) },
              { path: 'payments', lazy: lazyPage(() => import('@/pages/admin/PaymentsManagement')) },
              { path: 'notifications', lazy: lazyPage(() => import('@/pages/admin/NotificationsManagement')) },
              { path: 'announcements', lazy: lazyPage(() => import('@/pages/admin/AnnouncementsManagement')) },
              { path: 'assets', lazy: lazyPage(() => import('@/pages/admin/AssetsManagement')) },
              { path: 'training', lazy: lazyPage(() => import('@/pages/admin/TrainingManagement')) },
              { path: 'performance', lazy: lazyPage(() => import('@/pages/admin/PerformanceReviewsManagement')) },
              { path: 'helpdesk', lazy: lazyPage(() => import('@/pages/admin/HelpdeskManagement')) },
              { path: 'inbox', lazy: lazyPage(() => import('@/pages/client/NotificationsPage')) },
              { path: 'support', lazy: lazyPage(() => import('@/pages/admin/SupportTicketsPage')) },
              { path: 'blogs', lazy: lazyPage(() => import('@/pages/admin/BlogsManagement')) },
              { path: 'services', lazy: lazyPage(() => import('@/pages/admin/ServicesManagement')) },
              { path: 'careers', lazy: lazyPage(() => import('@/pages/admin/CareersManagement')) },
              { path: 'site-content', lazy: lazyPage(() => import('@/pages/admin/SiteContentPage')) },
              { path: 'reviews', lazy: lazyPage(() => import('@/pages/admin/ReviewsManagement')) },
              { path: 'chatbot', lazy: lazyPage(() => import('@/pages/admin/ChatbotManagement')) },
              { path: 'reports', lazy: lazyPage(() => import('@/pages/admin/ReportsPage')) },
              { path: 'roles', lazy: lazyPage(() => import('@/pages/admin/RolesPage')) },
              { path: 'permissions', lazy: lazyPage(() => import('@/pages/admin/PermissionsPage')) },
              { path: 'portal-menus', lazy: lazyPage(() => import('@/pages/admin/PortalMenusPage')) },
              { path: 'settings', lazy: lazyPage(() => import('@/pages/admin/SettingsPage')) },
              { path: 'profile', lazy: lazyPage(() => import('@/pages/account/AccountProfilePage')) },
              { path: 'change-password', lazy: lazyPage(() => import('@/pages/account/ChangePasswordPage')) },
              { path: 'security', lazy: lazyPage(() => import('@/pages/account/SecurityPage')) },
            ],
          },
        ],
      },
      {
        path: 'employee',
        children: [
          { index: true, lazy: lazyPage(() => import('@/pages/employee/EmployeeEntry')) },
          {
            lazy: async () => {
              const [{ ProtectedRoute }, { EmployeeLayout }] = await Promise.all([
                import('./ProtectedRoute'),
                import('@/components/layout/EmployeeLayout'),
              ])
              return {
                element: (
                  <ProtectedRoute allowedRoles={['employee']} loginPath="/employee">
                    <EmployeeLayout />
                  </ProtectedRoute>
                ),
                HydrateFallback: RouteHydrateFallback,
              }
            },
            children: [
              { path: 'profile', lazy: lazyPage(() => import('@/pages/employee/EmployeeProfilePage')) },
              { path: 'leave', lazy: lazyPage(() => import('@/pages/employee/EmployeeLeavePage')) },
              { path: 'attendance', lazy: lazyPage(() => import('@/pages/employee/EmployeeAttendancePage')) },
              { path: 'documents', lazy: lazyPage(() => import('@/pages/employee/EmployeeDocumentsPage')) },
              { path: 'tasks', lazy: lazyPage(() => import('@/pages/employee/EmployeeTasksPage')) },
              { path: 'projects', lazy: lazyPage(() => import('@/pages/employee/EmployeeProjectsPage')) },
              { path: 'timesheets', lazy: lazyPage(() => import('@/pages/employee/EmployeeTimesheetsPage')) },
              { path: 'calendar', lazy: lazyPage(() => import('@/pages/employee/EmployeeCalendarPage')) },
              { path: 'announcements', lazy: lazyPage(() => import('@/pages/employee/EmployeeAnnouncementsPage')) },
              { path: 'assets', lazy: lazyPage(() => import('@/pages/employee/EmployeeAssetsPage')) },
              { path: 'training', lazy: lazyPage(() => import('@/pages/employee/EmployeeTrainingPage')) },
              { path: 'performance', lazy: lazyPage(() => import('@/pages/employee/EmployeePerformancePage')) },
              { path: 'helpdesk', lazy: lazyPage(() => import('@/pages/employee/EmployeeHelpdeskPage')) },
              { path: 'resignation', lazy: lazyPage(() => import('@/pages/employee/EmployeeResignationPage')) },
              { path: 'notifications', lazy: lazyPage(() => import('@/pages/client/NotificationsPage')) },
              { path: 'change-password', lazy: lazyPage(() => import('@/pages/account/ChangePasswordPage')) },
              { path: 'security', lazy: lazyPage(() => import('@/pages/account/SecurityPage')) },
            ],
          },
        ],
      },
      {
        path: 'hr',
        children: [
          { index: true, lazy: lazyPage(() => import('@/pages/hr/HrEntry')) },
          {
            lazy: async () => {
              const { HrProtectedLayout } = await import('./HrProtectedLayout')
              return {
                element: <HrProtectedLayout />,
                HydrateFallback: RouteHydrateFallback,
              }
            },
            children: [
              { path: 'openings', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'applications', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'employees', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'leave', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'attendance', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'company-roles', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'portal-menus', lazy: lazyPage(() => import('@/pages/hr/HrPortalMenusPage')) },
              { path: 'announcements', lazy: lazyPage(() => import('@/pages/hr/HrAnnouncementsPage')) },
              { path: 'assets', lazy: lazyPage(() => import('@/pages/hr/HrAssetsPage')) },
              { path: 'training', lazy: lazyPage(() => import('@/pages/hr/HrTrainingPage')) },
              { path: 'performance', lazy: lazyPage(() => import('@/pages/hr/HrPerformancePage')) },
              { path: 'helpdesk', lazy: lazyPage(() => import('@/pages/hr/HrHelpdeskPage')) },
              { path: 'careers', lazy: lazyPage(() => import('@/pages/hr/HrCareersModulePage')) },
              { path: 'users', lazy: lazyPage(() => import('@/pages/hr/HrUsersPage')) },
              { path: 'notifications', lazy: lazyPage(() => import('@/pages/client/NotificationsPage')) },
              { path: 'profile', lazy: lazyPage(() => import('@/pages/account/AccountProfilePage')) },
              { path: 'change-password', lazy: lazyPage(() => import('@/pages/account/ChangePasswordPage')) },
              { path: 'security', lazy: lazyPage(() => import('@/pages/account/SecurityPage')) },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace />, HydrateFallback: RouteHydrateFallback },
    ],
  },
])
