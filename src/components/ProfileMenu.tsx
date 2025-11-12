import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, LogOut, LayoutDashboard } from 'lucide-react';

const BUCKET = 'profile-pictures';

export default function ProfileMenu({
  user,
  onNavigateToDashboard,
}: {
  user: any;
  onNavigateToDashboard: () => void;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarUrl(user?.user_metadata?.profile_picture_url ?? null);
  }, [user]);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Please select an image file');
    if (file.size > 5 * 1024 * 1024) return alert('File size must be < 5MB');

    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const name = `${user.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(name, file, {
        cacheControl: '3600', upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(name);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase.auth.updateUser({
        data: { profile_picture_url: publicUrl },
      });
      if (updErr) throw updErr;

      // Also save to profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          image_url: publicUrl,
          updated_at: new Date().toISOString()
        });
      if (profileErr) throw profileErr;

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="relative" ref={ref}>
      {/* Avatar button */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
        aria-label="Open profile menu"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
            No<br/>Image
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 p-2 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Upload */}
          <div className="relative">
            <input
              id="avatar-input-header"
              type="file"
              accept="image/*"
              onChange={onUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <button
              className={`w-full inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                uploading
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading…' : 'Upload Profile Picture'}
            </button>
          </div>

          {/* Go to Dashboard */}
          <button
            onClick={onNavigateToDashboard}
            className="w-full mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>

          {/* Logout */}
          <button
            onClick={signOut}
            className="w-full mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
