'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'user.country',
    'user.kyc_level'
  ]);
  const [datasource, setDatasource] = useState<string>('');

  const availableFields = [
    { id: 'user.country', label: 'Country', description: 'User country of residence' },
    { id: 'user.kyc_level', label: 'KYC Level', description: 'KYC verification level' },
    { id: 'user.email', label: 'Email', description: 'Verified email address' },
  ];

  const datasources = [
    { id: '', label: 'Any available' },
    { id: 'binance', label: 'Binance' },
    { id: 'coinbase', label: 'Coinbase' },
    { id: 'kraken', label: 'Kraken' },
  ];

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const queryParams = new URLSearchParams({
    fields: selectedFields.join(','),
    ...(datasource && { datasource })
  }).toString();

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Keyring Data Sharing
        </h1>
        <p className="text-xl text-gray-600">
          Verify user data with cryptographic proofs
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Select Fields to Request
          </h2>
          <p className="text-gray-600 mb-6">
            Choose which verified fields you want to request from the user
          </p>

          <div className="space-y-3">
            {availableFields.map((field) => (
              <label
                key={field.id}
                className="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                style={{
                  borderColor: selectedFields.includes(field.id) ? '#0ea5e9' : '#e5e7eb',
                  backgroundColor: selectedFields.includes(field.id) ? '#f0f9ff' : 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                  className="mt-1 h-5 w-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">{field.label}</div>
                  <div className="text-sm text-gray-500">{field.description}</div>
                  <code className="text-xs text-gray-400 mt-1 block">{field.id}</code>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Datasource (Optional)
          </h2>
          <p className="text-gray-600 mb-4">
            Specify a datasource or let the user choose
          </p>

          <select
            value={datasource}
            onChange={(e) => setDatasource(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {datasources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.label}
              </option>
            ))}
          </select>
        </div>

        <Link
          href={`/verify?${queryParams}`}
          className={`block w-full py-4 px-6 rounded-lg text-center font-semibold text-lg transition-colors ${
            selectedFields.length > 0
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={(e) => selectedFields.length === 0 && e.preventDefault()}
        >
          Start Verification
        </Link>

        {selectedFields.length === 0 && (
          <p className="text-center text-red-500 mt-3 text-sm">
            Please select at least one field
          </p>
        )}
      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Powered by Keyring Network</p>
      </div>
    </div>
  );
}