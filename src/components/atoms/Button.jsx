import React from 'react'
import { classes } from '../../config/theme/tokens.js'

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) => {
  const base = classes.button.base

  const variants = {
    primary: classes.button.primary,
    outline: classes.button.outline,
    danger: classes.button.danger,
    ghost: classes.button.ghost,
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-6 text-lg',
  }

  const width = fullWidth ? 'w-full' : ''

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      type={type}
      disabled={disabled}
      className={[base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, width, disabledCls, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}