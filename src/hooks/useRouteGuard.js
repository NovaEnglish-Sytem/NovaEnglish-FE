import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'

export const useRouteGuard = ({
  paramName = 'id',
  paramValue,
  validator,
  redirectTo = ROUTES.studentDashboard,
  errorMessage = 'Invalid route parameter',
  saveValid = false,
  routeTemplate = null
}) => {
  const navigate = useNavigate()

  useEffect(() => {
    const sessionKey = `last_valid_${paramName}`
    
    if (!paramValue) {
      console.error(`❌ Route Guard: ${paramName} is missing`)
      
      if (saveValid && routeTemplate) {
        const lastValid = sessionStorage.getItem(sessionKey)
        if (lastValid && validator(lastValid)) {
          const restoredRoute = routeTemplate.replace(`:${paramName}`, lastValid)
          navigate(restoredRoute, { replace: true })
          return
        }
      }
      
      navigate(redirectTo, { replace: true })
      return
    }

    if (validator && typeof validator === 'function') {
      const isValid = validator(paramValue)
      if (!isValid) {
        console.error(`❌ Route Guard: ${errorMessage} - ${paramName}:`, paramValue)
        
        if (saveValid && routeTemplate) {
          const lastValid = sessionStorage.getItem(sessionKey)
          if (lastValid && validator(lastValid) && lastValid !== paramValue) {
            const restoredRoute = routeTemplate.replace(`:${paramName}`, lastValid)
            navigate(restoredRoute, { replace: true })
            return
          }
        }
        
        navigate(redirectTo, { replace: true })
        return
      }
      
      if (saveValid) {
        sessionStorage.setItem(sessionKey, paramValue)
      }
    }
  }, [paramName, paramValue, validator, redirectTo, errorMessage, navigate, saveValid, routeTemplate])
}

export const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}
