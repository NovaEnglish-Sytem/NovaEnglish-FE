export const colors = {
  brand: {
    primary: '#007a33',
    primaryDark: '#006629',
    headerBg: '#003900',
    success: '#76c043',
    successDark: '#4da32f',
    surfaceBg: '#fbfbfb',
    surfaceBorder: '#ececec',
    danger: '#ff5722',
  },
  neutral: {
    textMuted: '#6b7280',
    grey: '#E6E6E6',
    slate: '#7d8797',
  },
}

export const classes = {
  // Surface card container used widely
  surfaceCard: 'bg-[#fbfbfb] border border-[#ececec] rounded-[20px] shadow-[4px_4px_2px_#0000000d]',

  // Generic white card used in several pages
  whiteCard: 'bg-white rounded-[10px] shadow-[0_4px_4px_#00000033]',

  // Header background (solid green with drop shadow)
  headerBg: 'bg-[#003900] shadow-[0_4px_12px_rgba(0,0,0,0.25)]',

  // Button presets
  button: {
    base: 'inline-flex items-center justify-center rounded-[5px] font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    primary: 'bg-[#007a33] text-white hover:bg-[#006629] focus:ring-[#007a33]',
    outline: 'border border-[#007a33] text-[#007a33] hover:bg-[#F5F5F5] focus:ring-[#6B7280]',
    danger: 'bg-[#ff5722] text-white hover:bg-[#d84315] focus:ring-[#ff5722]',
    ghost: 'border border-[#6B7280] text-[#6B7280] hover:bg-[#F5F5F5] focus:ring-[#6B7280]',
  },

  // Form accents (radio/checkbox/select) using brand color
  accentControl: 'accent-[#007a33]',
  focusBrand: 'focus:ring-[#007a33]',

  // Sidebar styles
  sidebar: {
    bg: 'bg-[#022702]',
    active: 'bg-[#263918] border-t border-b border-white',
  },

  // Soft control panel/button background frequently used for Filter/Sort
  controlSoft: 'bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033]',

  // Text helpers
  textSuccess: 'text-[#4da32f]',

  // Top navigation active background
  topNavActive: 'bg-[#216821]',

  // Link hover helper (success color)
  linkHoverSuccess: 'hover:text-[#4da32f]',

  // Layout tokens - Common heights and spacing
  layout: {
    pageTopSpacing: 'mt-16',           // Standard spacing below header
    sectionSpacing: 'mt-8',            // Between major sections
    cardSpacing: 'gap-6',              // Between cards in grid
    contentMaxWidth: 'max-w-7xl',     // Page content max width
    minContentHeight: 'min-h-[400px]', // Minimum content area height
    fullHeight: 'min-h-screen',        // Full viewport height
  },

  // State display containers
  state: {
    loading: 'flex flex-col items-center justify-center gap-4',
    error: 'flex flex-col items-center justify-center gap-4 px-4',
    empty: 'flex flex-col items-center justify-center gap-2 px-4',
  },

  // Typography helpers
  typography: {
    pageTitle: 'text-2xl font-bold text-gray-900',
    sectionTitle: 'text-xl font-semibold text-gray-900',
    cardTitle: 'text-lg font-semibold text-gray-900',
    body: 'text-base text-gray-700',
    bodySmall: 'text-sm text-gray-600',
    muted: 'text-sm text-gray-500',
  },

  // Common responsive patterns
  responsive: {
    gridCols: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    flexBetween: 'flex items-center justify-between',
    flexCenter: 'flex items-center justify-center',
    flexCol: 'flex flex-col',
  },
}

export default { colors, classes }