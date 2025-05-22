import React from 'react';
import { CheckCircle } from 'lucide-react';

const AccessRequestSection = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold leading-tight">Why Choose Our Billing Solution?</h2>
        <p className="text-gray-600 text-base">
          Simplify your finances with our powerful, easy-to-use web-based bill tracker.
          Designed for freelancers, startups, and growing businesses. No installation, no hassle.
        </p>

        {/* Features List */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[
            'Real-time expense tracking',
            'Automated monthly reports',
            'Multi-user collaboration',
            'PDF/Excel export options',
            'Smart category detection',
            'Recurring billing reminders',
          ].map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <div className="text-primary">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6">
        <StatCard number="3,212+" label="Bills Tracked" />
        <StatCard number="₹12.4M+" label="Expenses Analyzed" />
        <StatCard number="220+" label="Businesses Served" />
        <StatCard number="100%" label="Data Encrypted" />
      </div>
    </div>
  );
};

const StatCard = ({ number, label }: { number: string; label: string }) => (
  <div className="text-center bg-gray-50 p-4 rounded-xl shadow-sm hover:shadow-md transition">
    <h3 className="text-2xl font-semibold text-primary">{number}</h3>
    <p className="text-gray-600 text-sm mt-1">{label}</p>
  </div>
);

export default AccessRequestSection;
