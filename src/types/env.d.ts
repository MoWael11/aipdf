declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASE_URL: string
      NODE_ENV: 'development' | 'production'
    }
  }
}
export {}
