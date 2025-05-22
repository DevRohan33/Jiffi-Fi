import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import AccessRequestSection from '@/components/auth/AccessRequestSection';
import { Card } from '@/components/ui/card';

const Register = () => {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-50">
      {/* Left Side - Register Form */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-white">
        <Card className="w-full max-w-md p-6 border-none shadow-lg">
          <RegisterForm />
        </Card>
      </div>

      {/* Right Side - Access Request */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-primary/5">
        <div className="w-full max-w-md">
          <AccessRequestSection />
        </div>
      </div>
    </div>
  );
};

export default Register;
