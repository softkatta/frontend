import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RouteHydrateFallback } from '@/components/common/RouteHydrateFallback'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { MaintenanceGate } from '@/routes/MaintenanceGate'
import HomePage from '@/pages/public/HomePage'

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
          { index: true, element: <HomePage />, HydrateFallback: RouteHydrateFallback },
          { path: 'products', lazy: lazyPage(() => import('@/pages/public/ProductsPage')) },
          { path: 'products/:slug', lazy: lazyPage(() => import('@/pages/public/ProductDetailPage')) },
          { path: 'services', lazy: lazyPage(() => import('@/pages/public/ServicesPage')) },
          { path: 'services/:slug', lazy: lazyPage(() => import('@/pages/public/ServiceDetailPage')) },
          { path: 'pricing', lazy: lazyPage(() => import('@/pages/public/PricingPage')) },
          { path: 'about', lazy: lazyPage(() => import('@/pages/public/AboutPage')) },
          { path: 'contact', lazy: lazyPage(() => import('@/pages/public/ContactPage')) },
          { path: 'blog', lazy: lazyPage(() => import('@/pages/public/BlogPage')) },
          { path: 'blog/:slug', lazy: lazyPage(() => import('@/pages/public/BlogDetailPage')) },
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
          { path: 'products', lazy: lazyPage(() => import('@/pages/client/ClientProductsPage')) },
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
              { path: 'tenants', lazy: lazyPage(() => import('@/pages/admin/TenantsManagement')) },
              { path: 'customers', lazy: lazyPage(() => import('@/pages/admin/CustomersPage')) },
              { path: 'subscriptions', lazy: lazyPage(() => import('@/pages/admin/SubscriptionsManagement')) },
              { path: 'licenses', lazy: lazyPage(() => import('@/pages/admin/LicensesManagement')) },
              { path: 'product-integrations', lazy: lazyPage(() => import('@/pages/admin/ProductIntegrationsManagement')) },
              { path: 'invoices', lazy: lazyPage(() => import('@/pages/admin/InvoicesManagement')) },
              { path: 'invoices/:id', lazy: lazyPage(() => import('@/pages/admin/AdminInvoiceViewPage')) },
              { path: 'orders', lazy: lazyPage(() => import('@/pages/admin/OrdersPage')) },
              { path: 'payments', lazy: lazyPage(() => import('@/pages/admin/PaymentsManagement')) },
              { path: 'notifications', lazy: lazyPage(() => import('@/pages/admin/NotificationsManagement')) },
              { path: 'inbox', lazy: lazyPage(() => import('@/pages/client/NotificationsPage')) },
              { path: 'support', lazy: lazyPage(() => import('@/pages/admin/SupportTicketsPage')) },
              { path: 'blogs', lazy: lazyPage(() => import('@/pages/admin/BlogsManagement')) },
              { path: 'site-content', lazy: lazyPage(() => import('@/pages/admin/SiteContentPage')) },
              { path: 'reports', lazy: lazyPage(() => import('@/pages/admin/ReportsPage')) },
              { path: 'settings', lazy: lazyPage(() => import('@/pages/admin/SettingsPage')) },
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
