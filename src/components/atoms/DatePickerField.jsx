import React from 'react'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import TextField from '@mui/material/TextField'

export const DatePickerField = ({
  id = 'date',
  label = 'Date',
  value = '', // string 'YYYY-MM-DD' atau ''
  onChange = () => {},
  onBlur = () => {},
  error = '',
  helperText = '',
  disabled = false,
}) => {
  const today = dayjs()
  const parsedValue = value && dayjs(value).isValid() ? dayjs(value) : null

  return (
    <div className="w-full min-h-[100px]">
      {label && (
        <label
          htmlFor={id}
          className="block mb-1 text-base font-normal text-gray-700"
        >
          {label}
        </label>
      )}

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          openTo="year"
          views={['year', 'month', 'day']}
          value={parsedValue}
          maxDate={today}
          disabled={disabled}
          onChange={(val) => {
            const formatted =
              val && dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD') : ''
            onChange(formatted)
          }}
          enableAccessibleFieldDOMStructure={false}
          slotProps={{
            textField: {
              id,
              fullWidth: true,
              size: 'medium',
              error: Boolean(error),
              helperText: error || helperText,
              onBlur,
              variant: 'outlined',
              placeholder: 'MM/DD/YYYY',
              disabled,
              sx: {
                '& .MuiInputBase-root': {
                  borderRadius: '5px',
                  fontFamily: 'inherit',
                  backgroundColor: disabled ? '#e7e7e7b2' : '#fff',
                  minHeight: '48px',
                  outline: 'none',
                },
                '& .MuiInputBase-input': {
                  fontSize: '1rem',
                  lineHeight: 1.5,
                  color: disabled ? '#6B7280' : '#111827',
                  padding: '12px 44px 12px 12px',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9CA3AF',
                  opacity: 1,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9CA3AF',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#9CA3AF',
                },
                // Focus: hide default border and show custom green ring on the input root only
                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'transparent !important',
                },
                '& .MuiOutlinedInput-root.Mui-focused': {
                  boxShadow: '0 0 0 2px #007a33',
                },
                // Error border and ring scoped to input root (avoid wrapping helper text)
                '& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#EF4444',
                },
                '& .MuiOutlinedInput-root.Mui-error.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(239, 68, 68, 1)',
                },
                // Ensure helper text never gets border/ring
                '& .MuiFormHelperText-root': {
                  border: 'none',
                  boxShadow: 'none',
                  marginLeft: 0,
                },
                '& .MuiSvgIcon-root': {
                  color: '#6B7280',
                },
              },
            },
          }}
          slots={{ textField: TextField }}
        />
      </LocalizationProvider>
    </div>
  )
}

export default DatePickerField