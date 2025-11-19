import React from 'react'
import { AppLayout } from '../layouts/AppLayout.jsx'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/atoms/Button.jsx'

export const TermsAndConditions = () => {
  const navigate = useNavigate()

  const termsContent = [
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
    'Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.',
  ]

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <AppLayout showFooter={false}>
      {/* Main container styled to match original dimensions/positions */}
      <div className="min-h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="w-full max-w-5xl bg-white rounded-lg border-2 border-[#f0f0f0] shadow-md p-8">
          {/* Title */}
          <h1 className="font-medium text-gray-900 text-xl text-center leading-normal underline mb-6">
            Terms &amp; Conditions
          </h1>

          {/* Content */}
          <div className="max-h-[576px] overflow-y-auto font-normal text-gray-600 text-base leading-normal space-y-4">
            {termsContent.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-10">
            <Button
              variant="primary"
              className="w-40 sm:w-56 h-10 sm:h-12 text-sm sm:text-base"
              onClick={handleBack}
              aria-label="Agree to terms and conditions"
            >
              I AGREE
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
