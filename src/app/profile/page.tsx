'use client';
// src/app/profile/page.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { showToast } from '@/components/ui/Toast';
import { User, Calendar, MapPin, Phone, Camera, Loader2, Save } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [place, setPlace] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (!u) { router.replace('/'); return; }
        setUser(u);
        setPlace(u.place);
      });
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo must be under 5MB', 'error');
      return;
    }
    setPhotoFile(file);
    setEditing(true);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const fd = new FormData();
      if (place !== user.place) fd.append('place', place);
      if (photoFile) fd.append('photo', photoFile);

      const res = await fetch('/api/users/profile', { method: 'PATCH', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUser(data.user);
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditing(false);
      showToast('Profile updated! ✅', 'success');
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar user={user} />

      <div className="pt-14 pb-20 md:pb-8 px-4 max-w-md mx-auto">
        <h1 className="text-white font-black text-xl mt-4 mb-5">My Profile</h1>

        {/* Photo */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <label className="cursor-pointer group relative">
            <div className="w-24 h-24 rounded-2xl bg-blue-600 border-2 border-slate-700 group-hover:border-blue-500 flex items-center justify-center overflow-hidden transition-colors text-2xl font-black text-white">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : user.photo ? (
                <img src={user.photo} alt="" className="w-full h-full object-cover" />
              ) : getInitials(user.name)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-950">
              <Camera className="w-4 h-4 text-slate-900" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{user.name}</p>
            <p className="text-amber-400 font-black text-xl">{user.total_points} pts</p>
          </div>
        </div>

        {/* Info fields */}
        <div className="space-y-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-xs">Full Name</p>
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-slate-500 text-xs">Age & Gender</p>
              <p className="text-white text-sm font-medium">{user.age} years • {user.gender}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-slate-500 text-xs">Phone Number</p>
              <p className="text-white text-sm font-medium">{user.phone}</p>
            </div>
          </div>

          {/* Editable: Place */}
          <div className="bg-slate-800/60 border border-blue-700/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-slate-500 text-xs">Place <span className="text-blue-400">(editable)</span></p>
              <input
                type="text"
                value={place}
                onChange={(e) => { setPlace(e.target.value); setEditing(true); }}
                className="w-full bg-transparent text-white text-sm font-medium outline-none"
              />
            </div>
          </div>
        </div>

        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
          </button>
        )}
      </div>
    </div>
  );
}
