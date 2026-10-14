import { useState, useEffect } from 'react';
import {
  Camera,
  Mail,
  User as UserIcon,
  Phone,
  Loader2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Card, PageHeader } from '../components/Primitives';
import api from '../../services/api';
import { useUser } from '../../context/UserContext';

export default function ProfileSection({ onSave }) {
  const { user, updateUser } = useUser();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const [avatar, setAvatar] = useState(null);        // preview URL (base64 ya server URL)
  const [avatarFile, setAvatarFile] = useState(null); // File object — sirf save pe upload
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🔑 Jab user context update ho, avatar sync karo
  useEffect(() => {
    if (!user?.avatar) return;
    setAvatar(buildAvatarUrl(user.avatar));
  }, [user?.avatar]);

  // 🔑 Avatar URL helper — "null"/"undefined"/empty sab handle karta hai
  function buildAvatarUrl(value) {
    if (!value) return null;
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed === 'null' || trimmed === 'undefined') return null;

    // already full URL or base64 preview
    if (trimmed.startsWith('http') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // relative path — server URL lagao
    return `http://localhost:5000${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const handleAvatarChange = (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG and WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // 1️⃣ File save karo — upload save pe hoga
    setAvatarFile(file);

    // 2️⃣ Instant preview ke liye base64 banao
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatar(e.target.result);   // 👈 preview yahin set ho raha hai
    };
    reader.readAsDataURL(file);

    setSaved(false);
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    else if (form.fullName.trim().length < 2)
      next.fullName = 'Name looks too short';

    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'Enter a valid email';

    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required';
    else if (!/^\d{10,15}$/.test(form.phoneNumber.replace(/\D/g, '')))
      next.phoneNumber = 'Enter a valid phone number';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      let savedAvatarPath = user?.avatar || null;

      // 🔑 Sirf yahan upload karo — select karne pe NAHI
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const response = await api.put('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        savedAvatarPath = response.data.user.avatar;
        // server ka URL preview mein set karo
        setAvatar(buildAvatarUrl(savedAvatarPath));
        setAvatarFile(null);
      }

      let savedProfile = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      };

      if (
        form.fullName.trim() !== (user?.fullName || '') ||
        form.email.trim() !== (user?.email || '') ||
        form.phoneNumber.trim() !== (user?.phoneNumber || '')
      ) {
        const { data } = await api.put('/users/profile', savedProfile);
        savedProfile = {
          ...savedProfile,
          ...data.user,
        };
      }

      updateUser({
        ...savedProfile,
        avatar: savedAvatarPath,
      });

      setForm({
        fullName: savedProfile.fullName,
        email: savedProfile.email,
        phoneNumber: savedProfile.phoneNumber,
      });
      setIsEditing(false);

      onSave?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error(
        'Profile save error:',
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message ||
          'Failed to update profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Profile"
        description="This information will be visible to your contacts."
      />

      <Card>
        {/* ---------- Avatar preview ---------- */}
        <div className="px-5 sm:px-6 pt-6 pb-5 flex items-center gap-5">
          <div className="relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-base-800"
                onError={() => setAvatar(null)}  
              />
            ) : (
              <div className="w-20 h-20 rounded-full ring-4 ring-base-800 bg-base-800 grid place-items-center text-base-400">
                <UserIcon size={28} />
              </div>
            )}

            {isEditing && (
  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-accent-gradient grid place-items-center shadow-glow-accent ring-2 ring-base-900 cursor-pointer">
    <Camera size={13} className="text-base-950" />

    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="hidden"
      onChange={(e) => {
        handleAvatarChange(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  </label>
)}
          </div>

          <div>
            <p className="text-sm font-semibold text-base-100">Profile photo</p>
            {isEditing && (
              <p className="text-xs text-base-400 mt-0.5">
                Click the camera icon to change your avatar.<br></br>
                 JPG, PNG or WEBP. Max 2MB.
              </p>
            )}
            <p className="text-xs text-base-400 mt-0.5">
             
            </p>
          </div>
        </div>

        <div className="h-px bg-base-700/60 mx-5 sm:mx-6" />

        {/* ---------- Fields ---------- */}
        <div className="px-5 sm:px-6 py-5 space-y-4">
         <Field
          label="Full name"
          icon={UserIcon}
          value={form.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
          placeholder="Jordan Reyes"
          disabled={!isEditing}
        />

          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={update('email')}
            error={errors.email}
            placeholder="you@example.com"
            disabled={!isEditing}
          />

        <Field
          label="Phone number"
          icon={Phone}
          type="tel"
          value={form.phoneNumber}
          onChange={update('phoneNumber')}
          error={errors.phoneNumber}
          placeholder="+1 555 123 4567"
          disabled={!isEditing}
        />
        </div>

        <div className="h-px bg-base-700/60 mx-5 sm:mx-6" />

        {/* ---------- Save ---------- */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-end gap-3">

  {saved && (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 animate-fade-in">
      <Check size={14} />
      Changes saved
    </span>
  )}

  {!isEditing ? (
    <button
      onClick={() => setIsEditing(true)}
      className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
    >
      <Pencil size={15} />
      Edit profile
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={() => {
          setIsEditing(false);

          setForm({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phoneNumber: user?.phoneNumber || '',
          });

          setAvatar(
            user?.avatar
              ? buildAvatarUrl(user.avatar)
              : null
          );

          setAvatarFile(null);
          setErrors({});
        }}
        disabled={saving}
        className="h-10 px-4 rounded-xl border border-base-600 text-base-300 text-sm font-medium hover:bg-base-800 transition-all flex items-center gap-2"
      >
        <X size={15} />
        Cancel
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="h-10 px-5 rounded-xl bg-accent-gradient text-base-950 text-sm font-semibold shadow-glow-accent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center gap-2"
      >
        {saving && (
          <Loader2
            size={15}
            className="animate-spin"
          />
        )}

        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </>
  )}

</div>
      </Card>
    </div>
  );
}

function Field({ label, icon: Icon, error, prefix, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-medium text-base-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-400"
          />
        )}
        {prefix && (
          <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-base-400">
            {prefix}
          </span>
        )}
        <input
          {...rest}
          className={`w-full h-11 ${
            Icon ? (prefix ? 'pl-[3.3rem]' : 'pl-10') : 'pl-3.5'
          } pr-3.5 rounded-xl bg-base-800/60 border text-sm text-base-100 placeholder:text-base-500 outline-none transition-all ${
            error
              ? 'border-rose-500/60'
              : 'border-base-600/80 focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20'
          }`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
    </div>
  );
}