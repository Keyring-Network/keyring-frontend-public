'use client';

import { Suspense } from 'react';
import VerifyPageContent from './VerifyPageContent';

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}