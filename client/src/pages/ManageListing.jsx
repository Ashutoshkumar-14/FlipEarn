import { useAuth } from '@clerk/clerk-react'
import { Loader2Icon, Upload } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../configs/axios'
import { getAllPublicListing, getAllUserListing } from '../app/features/listingSlice'

const ManageListing = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userListings = [] } = useSelector((state) => state.listing || {})

  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [loadingListing, setLoadingListing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    platform: '',
    username: '',
    followers_count: '',
    engagement_rate: '',
    monthly_views: '',
    niche: '',
    price: '',
    description: '',
    verified: false,
    monetized: false,
    country: '',
    age_range: '',
    images: [],
  })

  const platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'twitch', 'discord'];
  const niche = [
    "Lifestyle",
    "Fashion",
    "Beauty",
    "Fitness",
    "Travel",
    "Food",
    "Gaming",
    "Technology",
    "Business",
    "Finance",
    "Education",
    "Entertainment",
    "Sports",
    "Music",
    "Art",
    "Photography",
    "Health",
    "Parenting",
    "Pets",
    "News",
    "Comedy",
    "DIY",
    "Automotive",
    "Real Estate",
    "Other"
  ];
  const ageRange = [
    "13-17 years",
    "18-24 years",
    "25-34 years",
    "35-44 years",
    "45-54 years",
    "55-64 years",
    "65+ years",
    "Mixed ages"
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;
    if (files.length + formData.images.length > 5) return toast.error("You can add up to 5 images")

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev, images: prev.images.filter((_, i) => i !== indexToRemove)
    }))
  }

  // Get listing data for edit if `id` is provided (edit mode)
  useEffect(() => {
    if (!id) return;

    setIsEditing(true)
    setLoadingListing(true)
    const listing = userListings.find((listing) => listing.id === id)
    if (listing) {
      setFormData(listing)
      setLoadingListing(false)
    } else {
      toast.error("Listing not found")
      navigate("/my-listings")
    }
  }, [id, userListings, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.loading('Saving...')
    const dataCopy = structuredClone(formData);

    try {
      if (isEditing) {
        dataCopy.images = formData.images.filter((image) => typeof image === 'string')

        const formDataInstance = new FormData()
        formDataInstance.append('accountDetails', JSON.stringify(dataCopy))

        formData.images.filter((image) => typeof image !== 'string').forEach((image) => {
          formDataInstance.append('images', image)
        })

        const token = await getToken()

        const { data } = await api.put('/api/listing/', formDataInstance, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        toast.dismiss()
        toast.success(data.message)
        dispatch(getAllUserListing({ getToken }))
        dispatch(getAllPublicListing())
        navigate('/my-listings')

      } else {
        delete dataCopy.images;
        const formDataInstance = new FormData();
        formDataInstance.append('accountDetails', JSON.stringify(dataCopy));

        formData.images.forEach((image) => {
          formDataInstance.append('images', image)
        })

        const token = await getToken()

        const { data } = await api.post('/api/listing/', formDataInstance, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        toast.dismiss();
        toast.success(data.message);
        dispatch(getAllUserListing({ getToken }))
        dispatch(getAllPublicListing())
        navigate('/my-listings')
      }

    } catch (error) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || error?.message || 'An error occurred');
      console.error(error);
    }
  };

  if (loadingListing) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <Loader2Icon className='size-7 animate-spin text-indigo-600' />
      </div>
    )
  }

  return (
    <div className='min-h-screen py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800'>
            {isEditing ? "Edit Listing" : "List Your Account"}
          </h1>
          <p className='text-gray-600 mt-2'>
            {isEditing ? 'Update your existing account listing' : 'Create a listing to display your account info'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Basic Information */}
          <Section title='Basic Information'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <InputField
                label='Listing Title *'
                value={formData.title}
                placeholder='e.g., Premium Travel Instagram Account'
                onChange={(v) => handleInputChange('title', v)}
                required={true}
              />

              <SelectField
                label='Platform *'
                value={formData.platform}
                onChange={(v) => handleInputChange('platform', v)}
                options={platforms}
                required={true}
              />

              <InputField
                label='Username/Handle *'
                value={formData.username}
                placeholder='e.g., @travelwithme'
                onChange={(v) => handleInputChange('username', v)}
                required={true}
              />

              <InputField
                label='Country'
                value={formData.country}
                placeholder='e.g., United States'
                onChange={(v) => handleInputChange('country', v)}
              />

              <SelectField
                label='Niche *'
                value={formData.niche}
                onChange={(v) => handleInputChange('niche', v)}
                options={niche}
                required={true}
              />

              <SelectField
                label='Primary Audience Age Range *'
                value={formData.age_range}
                onChange={(v) => handleInputChange('age_range', v)}
                options={ageRange}
                required={true}
              />
            </div>
          </Section>

          {/* Account Metrics */}
          <Section title='Account Metrics'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
              <InputField
                label='Followers Count *'
                type='number'
                value={formData.followers_count}
                placeholder='e.g., 15000'
                onChange={(v) => handleInputChange('followers_count', v)}
                required={true}
                min={0}
              />

              <InputField
                label='Engagement Rate (%) *'
                type='number'
                value={formData.engagement_rate}
                placeholder='e.g., 4.5'
                onChange={(v) => handleInputChange('engagement_rate', v)}
                required={true}
                min={0}
                max={100}
                step={0.01}
              />

              <InputField
                label='Monthly Views/Impressions'
                type='number'
                value={formData.monthly_views}
                placeholder='e.g., 50000'
                onChange={(v) => handleInputChange('monthly_views', v)}
                min={0}
              />
            </div>

            <div className='space-y-3'>
              <CheckboxField
                label='Account is verified on the platform'
                checked={formData.verified}
                onChange={(v) => handleInputChange('verified', v)}
              />

              <CheckboxField
                label='Account is monetized'
                checked={formData.monetized}
                onChange={(v) => handleInputChange('monetized', v)}
              />
            </div>
          </Section>

          {/* Pricing & Description */}
          <Section title='Pricing & Description'>
            <InputField
              label='Asking Price (USD) *'
              type='number'
              value={formData.price}
              placeholder='e.g., 2500.00'
              onChange={(v) => handleInputChange('price', v)}
              required={true}
              min={0}
              step={0.01}
            />

            <TextareaField
              label='Description *'
              value={formData.description}
              placeholder='Describe your account, its niche, audience demographics, and why it is valuable...'
              onChange={(v) => handleInputChange('description', v)}
              required={true}
            />
          </Section>

          {/* Screenshots & Proof */}
          <Section title='Screenshots & Proof'>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handleImageUpload}
                className='hidden'
                id='images'
              />
              <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <label
                htmlFor='images'
                className='inline-block px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
              >
                Choose Files
              </label>
              <p className='text-sm text-gray-500 mt-2'>
                Upload screenshots or proof of account analytics (max 5 images)
              </p>
            </div>

            {formData.images.length > 0 && (
              <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4'>
                {formData.images.map((img, index) => (
                  <div key={index} className='relative group'>
                    <img
                      src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                      alt={`Screenshot ${index + 1}`}
                      className='w-full h-24 object-cover rounded-lg'
                    />
                    <button
                      type='button'
                      onClick={() => removeImage(index)}
                      className='absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full hover:bg-red-700 flex items-center justify-center text-sm font-bold transition-colors'
                      title='Remove image'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Form Actions */}
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => navigate(-1)}
              type='button'
              className='px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
            >
              {isEditing ? 'Update Listing' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reusable Components
const Section = ({ title, children }) => (
  <div className='bg-white rounded-lg border border-gray-200 p-6 space-y-6'>
    <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>
    {children}
  </div>
)

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min = null,
  max = null,
  step = null
}) => (
  <div className='space-y-2'>
    <label className='block text-sm font-medium text-gray-700'>
      {label}
    </label>
    <input
      type={type}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className='w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
      required={required}
    />
  </div>
)

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required = false
}) => (
  <div className='space-y-2'>
    <label className='block text-sm font-medium text-gray-700'>
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
      required={required}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
)

const CheckboxField = ({
  label,
  checked,
  onChange,
  required = false
}) => (
  <label className='flex items-center space-x-3 cursor-pointer group'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      required={required}
      className='w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500'
    />
    <span className='text-sm text-gray-700 group-hover:text-gray-900'>
      {label}
    </span>
  </label>
)

const TextareaField = ({
  label,
  value,
  onChange,
  placeholder,
  required = false
}) => (
  <div className='space-y-2'>
    <label className='block text-sm font-medium text-gray-700'>
      {label}
    </label>
    <textarea
      rows={5}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className='w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none'
      required={required}
    />
  </div>
)

export default ManageListing