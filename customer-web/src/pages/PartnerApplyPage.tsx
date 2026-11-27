import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  User,
  MapPin,
  Clock,
  FileText,
  Image,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building
} from 'lucide-react';
import { submitRestaurantApplication } from '../services/partner.service';
import type { RestaurantApplication } from '../types';

export const PartnerApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1: Owner Info
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');

  // Step 2: Restaurant Info
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCategory, setRestaurantCategory] = useState('Italian');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const [operatingHours, setOperatingHours] = useState('10:00 AM - 10:00 PM');

  // Step 3: Location & Verification
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');

  // Step 4: Branding
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedApplication, setCompletedApplication] =
    useState<RestaurantApplication | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const created = await submitRestaurantApplication({
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        applicant_phone: applicantPhone,
        restaurant_name: restaurantName,
        restaurant_category: restaurantCategory,
        restaurant_description: restaurantDescription,
        operating_hours: operatingHours,
        country,
        city,
        address,
        postal_code: postalCode,
        business_reg_number: businessRegNumber,
        logo_url: logoUrl || undefined,
        cover_image_url: coverImageUrl || undefined,
      });

      setCompletedApplication(created);
    } catch (err) {
      console.error('Failed to submit application:', err);
      alert('Application submission failed. Please check your data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedApplication) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Application Submitted!
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to YUMMY Partner Network
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your application for <strong>{completedApplication.restaurant_name}</strong> has been received and is currently marked as <strong className="text-blue-700">PENDING</strong> review.
          </p>
        </div>

        {/* Application ID Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-md mx-auto text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Application Reference ID</span>
            <span className="font-extrabold text-blue-700 font-mono text-sm">
              {completedApplication.id}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Primary Contact</span>
            <span className="font-semibold text-slate-800">
              {completedApplication.applicant_email}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Review Timeline</span>
            <span className="font-semibold text-slate-800">
              Within 24–48 Business Hours
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={`/partner/status?id=${encodeURIComponent(completedApplication.id)}`}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Track Application Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-700 border border-blue-100">
          <Store className="w-3.5 h-3.5" />
          <span>Restaurant Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Partner with YUMMY
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Expand your kitchen reach, accept orders seamlessly, and connect with global diners.
        </p>
      </div>

      {/* Stepper Wizard Progress */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between text-xs font-bold text-slate-500">
        <div
          className={`flex items-center gap-2 ${
            step >= 1 ? 'text-blue-700 font-extrabold' : ''
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
            1
          </span>
          <span className="hidden sm:inline">Owner Info</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
        <div
          className={`flex items-center gap-2 ${
            step >= 2 ? 'text-blue-700 font-extrabold' : ''
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
            2
          </span>
          <span className="hidden sm:inline">Restaurant</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
        <div
          className={`flex items-center gap-2 ${
            step >= 3 ? 'text-blue-700 font-extrabold' : ''
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
            3
          </span>
          <span className="hidden sm:inline">Location</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
        <div
          className={`flex items-center gap-2 ${
            step >= 4 ? 'text-blue-700 font-extrabold' : ''
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
            4
          </span>
          <span className="hidden sm:inline">Media</span>
        </div>
      </div>

      {/* Multi-step Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl space-y-6"
      >
        {/* Step 1: Owner Information */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Step 1: Restaurant Owner Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marco Rossi"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                required
                placeholder="marco@trattoriarossi.com"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number (with Country Code)
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-0182 or +44 7911 123456"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                disabled={!applicantName || !applicantEmail || !applicantPhone}
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Continue to Restaurant Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Restaurant Details */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Step 2: Restaurant Profile</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant Brand Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Trattoria Rossi & Pizzeria"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Cuisine / Category
                </label>
                <select
                  value={restaurantCategory}
                  onChange={(e) => setRestaurantCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Italian">Italian & Pasta</option>
                  <option value="Burgers">Burgers & Fast Food</option>
                  <option value="Pizza">Artisanal Pizza</option>
                  <option value="Japanese">Japanese & Sushi</option>
                  <option value="Asian">Asian & Noodle Bar</option>
                  <option value="Mexican">Mexican & Tacos</option>
                  <option value="Healthy">Healthy & Salads</option>
                  <option value="Bakery">Bakery & Cafe</option>
                  <option value="Sri Lankan">Sri Lankan Authentic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 10:00 PM"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Description / Specialty
              </label>
              <textarea
                rows={3}
                placeholder="Describe your kitchen concept, signature dishes and specialty cooking..."
                value={restaurantDescription}
                onChange={(e) => setRestaurantDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!restaurantName.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location & Business Verification */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Step 3: Location & Verification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United States, United Kingdom, etc."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New York, London, Sydney"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Physical Restaurant Address
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 450 Broadway, Suite 101"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="10013"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Registration / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BR-88219491"
                  value={businessRegNumber}
                  onChange={(e) => setBusinessRegNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!country.trim() || !city.trim() || !address.trim()}
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
              >
                <span>Continue to Media</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Branding & Photos */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              <span>Step 4: Branding & Photos</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant Logo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restaurant Cover / Banner Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
              <strong>Application Notice:</strong> By submitting, you affirm that the information is accurate. Once submitted, our partner verification team will review your application within 24-48 hours and notify you.
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-sm shadow-lg transition flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Partner Application</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
