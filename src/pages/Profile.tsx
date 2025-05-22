import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

interface ProfileData {
  full_name: string;
  email: string;
  credit: number;
  profile_image_url: string;
  address: string;
  business_name: string;
  city: string;
  state: string;
  country: string;
  pin: string;
  mobile: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    profile_image_url: '',
    address: '',
    business_name: '',
    city: '',
    state: '',
    country: '',
    pin: '',
    mobile: '',
    credit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          profile_image_url: data.profile_image_url || '',
          address: data.address || '',
          business_name: data.business_name || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          pin: data.pin || '',
          mobile: data.mobile || '',
          credit: data.credit || 0,
        });
        if (data.profile_image_url) {
          setImagePreview(data.profile_image_url);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setErrorMsg('Error fetching profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl = profile.profile_image_url;
      if (imagePreview && imagePreview !== profile.profile_image_url) {
        const fileInput = document.getElementById('profile_image') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
          const file = fileInput.files[0];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}.${fileExt}`;
          const filePath = fileName;

          const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(filePath, file, { upsert: true });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

          imageUrl = urlData.publicUrl;
        }
      }

      const updates: any = {
        full_name: profile.full_name || '',
        address: profile.address || '',
        business_name: profile.business_name || '',
        profile_image_url: imageUrl || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        pin: profile.pin || '',
        mobile: profile.mobile || '',
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);
      

      if (error) throw error;

      setProfile(prev => ({ ...prev, profile_image_url: imageUrl }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMsg('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-6 sm:p-10">
      <div className="w-full max-w-5xl mx-auto bg-white p-8 shadow-2xl rounded-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-extrabold text-blue-700">Your Profile</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
          >
            ← Back to Dashboard
          </button>
        </div>

        {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-lg">
            <div className="col-span-full">
              <label className="block font-semibold mb-2 text-gray-700">Profile Photo</label>
              <div className="flex items-center gap-6">
                <img
                  src={imagePreview || '/default-avatar.png'}
                  alt="Preview"
                  className="w-28 h-28 rounded-full border-2 border-blue-400 object-cover"
                />
                <input
                  id="profile_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="profile_image" className="cursor-pointer text-white bg-blue-500 px-5 py-2 rounded hover:bg-blue-600 shadow">
                  Change Photo
                </label>
              </div>
            </div>

            <input name="full_name" value={profile.full_name} onChange={handleInputChange} placeholder="Full Name" className="p-3 border rounded" required />
            <input type="email" value={profile.email} disabled readOnly className="p-3 border rounded bg-gray-100" />
            <input name="mobile" value={profile.mobile} onChange={handleInputChange} placeholder="Mobile Number" className="p-3 border rounded" />
            <input name="business_name" value={profile.business_name} onChange={handleInputChange} placeholder="Business Name" className="p-3 border rounded" />
            <textarea name="address" value={profile.address} onChange={handleInputChange} placeholder="Street Address" rows={2} className="col-span-full p-3 border rounded" />
            <input name="city" value={profile.city} onChange={handleInputChange} placeholder="City" className="p-3 border rounded" />
            <input name="state" value={profile.state} onChange={handleInputChange} placeholder="State" className="p-3 border rounded" />
            <input name="country" value={profile.country} onChange={handleInputChange} placeholder="Country" className="p-3 border rounded" />
            <input name="pin" value={profile.pin} onChange={handleInputChange} placeholder="Pin Code" className="p-3 border rounded" />

            <div className="col-span-full flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" disabled={isLoading} className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 shadow">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <img
                src={profile.profile_image_url || '/default-avatar.png'}
                alt="Profile"
                className="w-36 h-36 rounded-full border-4 border-blue-400 shadow-md object-cover"
              />
              <div>
                <h3 className="text-3xl font-bold text-gray-800">{profile.full_name}</h3>
                <p className="text-lg text-gray-600">{profile.email}</p>
                <p className="text-lg text-gray-600">📞 {profile.mobile}</p>
                <p className="text-lg text-gray-600">🏢 {profile.business_name}</p>
                <p className="text-lg text-gray-600">📍 {profile.address}, {profile.city}, {profile.state}, {profile.pin}, {profile.country}</p>
              </div>
            </div>

            <div className="mt-10 p-6 bg-green-100 rounded-xl shadow-inner">
              <h4 className="text-2xl font-semibold text-green-800 mb-2">Your Credit</h4>
              <p className="text-4xl font-bold text-green-600">{profile.credit.toFixed(2)}</p>
            </div>

            <div className="mt-10 text-right">
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md"
              >
                ✏️ Edit Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
