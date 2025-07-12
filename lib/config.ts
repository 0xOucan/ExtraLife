// Environment configuration for Extra Life Insurance App
export const config = {
  // Application mode
  mode: process.env.MODE || 'mock',
  
  // Juno API Configuration
  juno: {
    apiKey: process.env.JUNO_API_KEY || '',
    apiSecret: process.env.JUNO_API_SECRET || '',
    clabe: process.env.JUNO_CLABE || '',
    baseUrl: process.env.MODE === 'production' 
      ? process.env.JUNO_BASE_URL_PROD || 'https://api.buildwithjuno.com'
      : process.env.JUNO_BASE_URL_STAGE || 'https://stage.buildwithjuno.com',
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  
  // App configuration
  app: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || 'development-secret-key',
  },
  
  // Insurance policy configurations
  insurance: {
    // Base rates by region (Mexico states)
    regionRates: {
      'cdmx': 1.2,
      'jalisco': 1.0,
      'nuevo_leon': 1.1,
      'yucatan': 0.9,
      'puebla': 0.95,
      'default': 1.0
    },
    
    // Age multipliers
    ageRates: {
      '18-25': 0.8,
      '26-35': 0.9,
      '36-45': 1.0,
      '46-55': 1.3,
      '56-65': 1.6,
      '66+': 2.0
    },
    
    // Gender multipliers
    genderRates: {
      'male': 1.1,
      'female': 0.95,
      'other': 1.0
    },
    
    // Base coverage amounts in MXN
    baseCoverage: {
      'basic': 100000,
      'standard': 250000,
      'premium': 500000,
      'platinum': 1000000
    }
  }
}

export const isProduction = config.mode === 'production'
export const isMock = config.mode === 'mock' 