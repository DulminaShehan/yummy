import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Store,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { getApplicationStatus } from '../services/partner.service';
import type { RestaurantApplication, ApplicationStatus } from '../types';
import { formatDateTime } from '../lib/format';

export const PartnerStatusPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialId);
  const [application, setApplication] = useState<RestaurantApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (searchKey: string) => {
    if (!searchKey.trim()) return;
    setIsLoading(true);
    setHasSearched(true);

    getApplicationStatus(searchKey)
      .then(setApplication)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            ✓ APPROVED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            ● UNDER REVIEW
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            ⏳ PENDING REVIEW
          </span>
        );
      case 'RESUBMISSION_REQUIRED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-800 border border-orange-200">
            ⚠ RESUBMISSION REQUIRED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200">
            ✕ REJECTED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Partner Application Status
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Enter your Application ID or registered email address to check the live status of your restaurant partner application.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="e.g. APP-ABC1234 or owner@restaurant.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
          >
            Check Status
          </button>
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-medium">Looking up application...</p>
        </div>
      ) : application ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs text-slate-400 font-mono">
                {application.id}
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {application.restaurant_name}
              </h2>
              <p className="text-xs text-slate-500">
                {application.city}, {application.country} • {application.restaurant_category}
              </p>
            </div>

            <div>{getStatusBadge(application.status)}</div>
          </div>

          {/* Review Message / Status Description */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">Application Progress:</p>
            {application.status === 'APPROVED' ? (
              <p className="text-emerald-700">
                Congratulations! Your restaurant has been verified and approved by the YUMMY platform team. You can now access your restaurant management portal.
              </p>
            ) : application.status === 'UNDER_REVIEW' ? (
              <p className="text-blue-700">
                Our verification team is currently verifying your business registration and restaurant location details.
              </p>
            ) : application.status === 'RESUBMISSION_REQUIRED' ? (
              <p className="text-orange-700">
                Additional business information or clearer photos are required. Please check your email for admin instructions.
              </p>
            ) : application.status === 'REJECTED' ? (
              <p className="text-red-700">
                {application.admin_notes ||
                  'Your application does not meet current platform onboarding requirements.'}
              </p>
            ) : (
              <p className="text-slate-600">
                Your application has been received and queued for administrative review.
              </p>
            )}
          </div>

          {/* Action if Approved */}
          {application.status === 'APPROVED' && (
            <div className="pt-2">
              <Link
                to="/partner/login"
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Launch Restaurant Partner Dashboard</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Application Details Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 border-t border-slate-100 pt-4">
            <div>
              <span className="text-slate-400 block">Applicant Name</span>
              <strong className="text-slate-800">{application.applicant_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Registered Email</span>
              <strong className="text-slate-800">{application.applicant_email}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Contact Phone</span>
              <strong className="text-slate-800">{application.applicant_phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Submitted At</span>
              <strong className="text-slate-800">
                {formatDateTime(application.created_at)}
              </strong>
            </div>
          </div>
        </div>
      ) : hasSearched ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No application found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find an application matching "{query}". Please verify your reference ID or email address.
          </p>
          <Link
            to="/partner/apply"
            className="mt-3 inline-block px-5 py-2.5 bg-blue-700 text-white rounded-full text-xs font-bold"
          >
            Submit an Application
          </Link>
        </div>
      ) : null}
    </div>
  );
};
