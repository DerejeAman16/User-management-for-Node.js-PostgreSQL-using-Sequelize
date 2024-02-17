export default {
  meEndpoint: '/auth/me',
  loginEndpoint: '/register/api/user/login',
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
