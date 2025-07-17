'use client';

import { Suspense } from 'react';
import RechargeCustomerPortal, {
  useCustomerPortalStatus
} from 'components/recharge-customer-portal';

function CustomerPortalContent() {
  return (
    <div className="customer-portal-page">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600">
              Manage your subscriptions, billing information, and account settings
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <RechargeCustomerPortal
              height={800}
              className="w-full"
              onLoad={() => {
                console.log('Customer portal loaded successfully');
              }}
              onError={(error) => {
                console.error('Customer portal error:', error);
              }}
            />
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Having trouble? Contact our{' '}
              <a href="/contact" className="text-blue-600 underline hover:text-blue-700">
                support team
              </a>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerPortalFallback() {
  return (
    <div className="customer-portal-loading">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600">Loading your account information...</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <div className="text-gray-600">Loading Customer Portal...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortalPage() {
  return (
    <Suspense fallback={<CustomerPortalFallback />}>
      <CustomerPortalContent />
    </Suspense>
  );
}
