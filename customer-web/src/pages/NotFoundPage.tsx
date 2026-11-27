import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-4">
      <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
        <UtensilsCrossed className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
        404 – Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-sm">
        The page you are looking for might have been moved or doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};
