import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const plans = [
  {
    title: "Monthly Plan",
    price: "₹349",
    duration: "1 month",
    features: [
      "Add all types of bills",
      "Unlimited data storage",
      "Access last 6 months of data",
    ],
    tag: "Starter",
  },
  {
    title: "6 Months Plan",
    price: "₹1799",
    duration: "6 months",
    features: [
      "Add all types of bills",
      "Unlimited data storage",
      "Access last 1 year of data",
    ],
    tag: "Popular",
  },
  {
    title: "Yearly Plan",
    price: "₹2999",
    duration: "12 months",
    features: [
      "Add all types of bills",
      "Unlimited data storage",
      "Access up to 10 years of data history",
    ],
    tag: "Best Value",
  },
];

export default function PaymentPage() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          console.error('No user logged in');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleWhatsAppMessage = (messageContent) => {
    if (!userId) {
      alert('Please login to continue');
      return;
    }
    
    const message = encodeURIComponent(
      `${messageContent} My user ID is "${userId}".`
    );
    window.open(`https://wa.me/918585059644?text=${message}`, '_blank');
  };

  const handleDemoPack = () => {
    handleWhatsAppMessage("I would like to try the demo pack for JiffiFi.");
  };

  const handlePlanSelection = (planName) => {
    handleWhatsAppMessage(`I need "${planName}" plan for JiffiFi.`);
  };

  if (loading) {
    return <div className="w-full px-6 py-12 bg-gray-50 text-center">Loading...</div>;
  }

  return (
    <div className="w-full px-6 py-12 bg-gray-50">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        {/* Left Content */}
        <div className="md:w-1/2 w-full">
          <h2 className="text-3xl font-bold text-purple-800 mb-4">Powerful Bill Management</h2>
          <p className="text-gray-600 mb-6">
            Track your bills, store unlimited data, and access your bill history easily. Choose the perfect plan to unlock premium features.
          </p>
          <button
            className="bg-purple-600 text-white px-5 py-2 rounded-lg shadow hover:bg-purple-700 transition"
            onClick={handleDemoPack}
            disabled={!userId}
          >
            {userId ? 'Try a Demo' : 'Login to Try Demo'}
          </button>
        </div>

        {/* Right Ad Image */}
        <div className="md:w-1/2 w-full flex justify-center md:justify-end">
          <img
            src="/19rs-bg.png" 
            alt="JiffiFi Bill Management"
            className="w-full md:w-[90%] max-w-md rounded-xl object-contain"
          />
        </div>
      </div>


      {/* Title */}
      <h2 className="text-center text-3xl font-semibold text-gray-800 mb-4">Upgrade Your Plan</h2>
      <p className="text-center text-gray-500 mb-8">
        Choose the best plan that fits your needs. Add bills, store unlimited data, and access your bill history based on your plan.
      </p>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`group bg-white border rounded-xl p-6 shadow-md hover:scale-105 hover:shadow-xl transition-all duration-300 relative ${
              plan.tag === 'Popular' ? 'border-purple-500 ring-2 ring-purple-400' : ''
            }`}
          >
            {plan.tag && (
              <span className="absolute -top-3 left-4 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                {plan.tag}
              </span>
            )}
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{plan.title}</h3>
            <div className="text-purple-700 text-3xl font-bold mb-1">{plan.price}</div>
            <p className="text-sm text-gray-500 mb-4">{plan.duration}</p>
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-center">
                  ✅ <span className="ml-2">{feature}</span>
                </li>
              ))}
            </ul>
            <button 
              className="w-full border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white py-2 rounded-md transition"
              onClick={() => handlePlanSelection(plan.title)}
              disabled={!userId}
            >
              {userId ? 'Choose Plan' : 'Login to Select'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}