// ** React Imports
import { createContext, useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Axios
import axios from 'axios'

// ** Config
import authConfig from 'src/configs/auth'
import moment from 'moment'

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  refresh: false,
  setRefresh: () => Promise.resolve()
}
const AuthContext = createContext(defaultProvider)

const AuthProvider = ({ children }) => {
  // ** States
  const [user, setUser] = useState(defaultProvider.user)
  const [loading, setLoading] = useState(defaultProvider.loading)
  const [refresh, setRefresh] = useState(defaultProvider.loading)
  // ** Hooks
  const router = useRouter()
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)
      console.log('storedToken', storedToken)
      if (storedToken) {
        setLoading(true)
        await axios
          .post(process.env.NEXT_PUBLIC_BASE_API + authConfig.meEndpoint, {
            cookies: { jwt: storedToken },
            headers: {
              authorization: storedToken
            }
          })
          .then(async response => {
            setLoading(false)

            window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken)
            setUser(JSON.parse(window.localStorage.getItem('userData')))
            const returnUrl = router.query.returnUrl
            const redirectURL = returnUrl && returnUrl !== '/home' ? returnUrl : '/home'
            router.replace(redirectURL)
          })
          .catch(err => {
            setLoading(false)
            localStorage.removeItem('userData')
            localStorage.removeItem('accessToken')
            setUser(null)
            router.replace('/login')
          })
      } else {
        setLoading(false)
      }
    }
    initAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  /*   const handleLogin = (params, errorCallback) => {
    axios
      .post(process.env.NEXT_PUBLIC_BASE_API + authConfig.loginEndpoint, params)
      .then(async response => {
        params.rememberMe
          ? window.localStorage.setItem(authConfig.storageTokenKeyName, response.data.accessToken)
          : null
        const returnUrl = router.query.returnUrl
        setUser(response.data.userData)
        params.rememberMe ? window.localStorage.setItem('userData', JSON.stringify(response.data.userData)) : null
        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
        router.replace(redirectURL)
      })
      .catch(err => {
        console.log('err', err)
        if (errorCallback) errorCallback(err)
      })
  } */
  const handleLogin = (params, errorCallback) => {
    fetch(process.env.NEXT_PUBLIC_BASE_API + authConfig.loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const responseData = await response.json()
        if (params.rememberMe) {
          window.localStorage.setItem(authConfig.storageTokenKeyName, responseData.accessToken)
          window.localStorage.setItem('userData', JSON.stringify(responseData.userData))
        }
        const returnUrl = router.query.returnUrl
        setUser(responseData.userData)
        const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/'
        router.replace(redirectURL)
      })
      .catch(err => {
        console.log('err', err)
        if (errorCallback) errorCallback(err)
      })
  }

  const handleLogout = () => {
    setUser(null)
    window.localStorage.removeItem('userData')
    window.localStorage.removeItem(authConfig.storageTokenKeyName)
    router.push('/login')
  }

  const handleRefresh = () => {
    setRefresh(r => !r)
  }

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    handleRefresh
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}

export { AuthContext, AuthProvider }
