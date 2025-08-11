import { useState } from "react";
import { useUpdateProfile } from "@/api/hooks/useUpdateProfile";
import { useUploadBanner } from "@/api/hooks/useUploadBanner";
import {
  SocialMediaInput,
  getValidationError,
} from "@/components/ui/social-media-input";
import { X, Image } from "lucide-react";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (formData: any) => void;
  onSuccess?: () => void;
  user: any;
  currentUserId: string;
}

interface EditFormData {
  bio: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    youtube: string;
    facebook: string;
  };
  coverPhoto: File | null;
  coverPhotoUrl?: string;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  currentUserId,
}: ProfileEditModalProps) {
  const { updateProfile, isUpdating } = useUpdateProfile({
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const { uploadBannerAsync, isUploading } = useUploadBanner();

  const [editForm, setEditForm] = useState<EditFormData>({
    bio: "",
    socialLinks: {
      twitter: "",
      instagram: "",
      youtube: "",
      facebook: "",
    },
    coverPhoto: null,
  });

  // Initialize form when modal opens
  useState(() => {
    if (isOpen && user) {
      setEditForm({
        bio: (user as any)?.bio || "",
        socialLinks: {
          twitter: user?.socialLinks?.twitter || "",
          instagram: user?.socialLinks?.instagram || "",
          youtube: user?.socialLinks?.youtube || "",
          facebook: user?.socialLinks?.facebook || "",
        },
        coverPhoto: null,
        coverPhotoUrl: (user as any)?.coverPhoto || "",
      });
    }
  });

  const handleSaveProfile = async () => {
    try {
      // Validate all social media URLs before saving
      const socialPlatforms = [
        "twitter",
        "instagram",
        "youtube",
        "facebook",
      ] as const;
      const validationErrors = socialPlatforms
        .map((platform) =>
          getValidationError(editForm.socialLinks[platform], platform),
        )
        .filter((error) => error !== null);

      if (validationErrors.length > 0) {
        alert(
          `Please fix the following errors:\n\n${validationErrors.join("\n")}`,
        );
        return;
      }

      let coverPhotoUrl = editForm.coverPhotoUrl;

      // Upload cover photo if a new one was selected
      if (editForm.coverPhoto) {
        try {
          coverPhotoUrl = await uploadBannerAsync(editForm.coverPhoto);
        } catch (error) {
          // Error is already handled by the hook
          return;
        }
      }

      // Prepare form data for saving
      const formDataToSave = {
        userId: user.id,
        bio: editForm.bio,
        socialLinks: editForm.socialLinks,
        coverPhotoUrl,
        reqUserId: currentUserId,
      };

      await updateProfile(formDataToSave);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleCoverPhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, coverPhoto: file }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const isLoading = isUpdating || isUploading;

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-dark-gray max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-white'>Edit Profile</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-white'>
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='space-y-6'>
          {/* Cover Photo Section */}
          <div>
            <h3 className='mb-3 text-lg font-medium text-white'>Cover Photo</h3>
            <div className='mb-2 text-sm text-gray-400'>
              Recommended size: 1200x300 pixels. Max file size: 5MB.
            </div>
            <div className='relative h-32 w-full overflow-hidden rounded-lg bg-gray-800'>
              {editForm.coverPhoto ? (
                <img
                  src={URL.createObjectURL(editForm.coverPhoto)}
                  alt='Cover preview'
                  className='h-full w-full object-cover'
                />
              ) : editForm.coverPhotoUrl ? (
                <img
                  src={editForm.coverPhotoUrl}
                  alt='Current cover'
                  className='h-full w-full object-cover'
                />
              ) : (
                <div className='flex h-full items-center justify-center text-gray-400'>
                  <Image className='mr-2 h-8 w-8' />
                  No cover photo
                </div>
              )}
              <label className='absolute bottom-2 right-2 cursor-pointer rounded bg-black bg-opacity-50 px-3 py-1 text-sm text-white hover:bg-opacity-70'>
                <input
                  type='file'
                  accept='image/*'
                  onChange={handleCoverPhotoChange}
                  className='hidden'
                  disabled={isLoading}
                />
                {isLoading ? "Uploading..." : "Change Photo"}
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className='mb-3 text-lg font-medium text-white'>
              Basic Information
            </h3>
            <div className='space-y-4'>
              <div>
                <div className='flex items-center justify-between'>
                  <label className='block text-sm font-medium text-gray-300'>
                    Bio
                  </label>
                  <span className='text-xs text-gray-400'>
                    {editForm.bio.length}/500
                  </span>
                </div>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder='Tell us about yourself...'
                  className='focus:border-ufc-blue mt-1 w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none'
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div>
            <h3 className='mb-3 text-lg font-medium text-white'>
              Social Media
            </h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <SocialMediaInput
                platform='twitter'
                label='X'
                placeholder='https://x.com/username'
                value={editForm.socialLinks.twitter}
                onChange={handleSocialLinkChange}
                disabled={isLoading}
              />
              <SocialMediaInput
                platform='instagram'
                label='Instagram'
                placeholder='https://instagram.com/username'
                value={editForm.socialLinks.instagram}
                onChange={handleSocialLinkChange}
                disabled={isLoading}
              />
              <SocialMediaInput
                platform='youtube'
                label='YouTube'
                placeholder='https://youtube.com/@username'
                value={editForm.socialLinks.youtube}
                onChange={handleSocialLinkChange}
                disabled={isLoading}
              />
              <SocialMediaInput
                platform='facebook'
                label='Facebook'
                placeholder='https://facebook.com/username'
                value={editForm.socialLinks.facebook}
                onChange={handleSocialLinkChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='mt-8 flex justify-end space-x-3'>
          <button
            onClick={onClose}
            className='rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white'
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            className='bg-ufc-blue hover:bg-ufc-blue-dark rounded-lg px-4 py-2 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-50'
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
