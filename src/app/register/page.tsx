'use client';
// src/app/register/page.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, User, Phone, MapPin, Calendar, Camera, Loader2, ArrowLeft } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    place: '',
    phone: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'error');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { name, age, gender, place, phone } = formData;

    if (!name.trim() || !age || !gender || !place.trim() || !phone.trim()) {
      showToast('All fields are required', 'error');
      return;
    }

    if (parseInt(age) < 5 || parseInt(age) > 100) {
      showToast('Age must be between 5 and 100', 'error');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('age', age);
      fd.append('gender', gender);
      fd.append('place', place.trim());
      fd.append('phone', phone.trim());
      if (photoFile) fd.append('photo', photoFile);

      const res = await fetch('/api/users/register', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Account created! Welcome 🎉', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="p-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Create Account</p>
            <p className="text-amber-400 text-xs">WC 2026 Prediction</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <label className="cursor-pointer group">
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 group-hover:border-blue-500 flex items-center justify-center overflow-hidden transition-colors relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Photo</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
            <p className="text-slate-500 text-xs">Optional — tap to add photo</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your full name"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Age + Gender row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Age *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="25"
                  min="5"
                  max="100"
                  className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-3 text-white focus:border-blue-500 outline-none text-sm"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Place */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Place *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                placeholder="City / Town"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971 50 000 0000"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">This is your login ID. Must be unique.</p>
          </div>

          {/* Points rules */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
            <p className="text-blue-300 font-bold text-sm mb-2">🏆 How Points Work</p>
            <div className="space-y-1 text-slate-400 text-xs">
              <p>✅ Correct winner prediction → <span className="text-white font-semibold">+5 pts</span></p>
              <p>🎯 Exact score prediction → <span className="text-white font-semibold">+5 pts</span></p>
              <p>🏅 Maximum per match → <span className="text-amber-400 font-semibold">10 pts</span></p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : 'Create Account →'}
          </button>

          <p className="text-center text-slate-500 text-sm">
            Already registered?{' '}
            <Link href="/" className="text-amber-400 hover:text-amber-300 font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
