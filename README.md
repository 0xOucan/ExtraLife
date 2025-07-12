# Extra Life Insurance DApp

## Overview

Extra Life is a Web3 insurance platform that enables Mexican users to purchase life insurance policies backed by MXNB stablecoin on the Arbitrum blockchain. The platform integrates with Juno (Bitso's infrastructure) to handle MXN deposits and MXNB token minting.

## Features

### 🏥 Insurance Management
- **Policy Creation**: Buy insurance policies based on age, gender, and region
- **Beneficiary Management**: Register and manage policy beneficiaries
- **Premium Calculation**: Dynamic pricing based on demographic factors
- **Policy Status Tracking**: Monitor policy status and payments

### 💰 Payment Processing
- **Juno Integration**: Seamless MXN to MXNB conversion
- **CLABE Generation**: Automatic SPEI-compatible bank account creation
- **Mock Mode**: Development environment with simulated transactions
- **Multi-currency Support**: Handle both MXN and MXNB currencies

### 📋 Claims Processing
- **Digital Claims**: Upload death certificates and supporting documents
- **Automated Review**: Streamlined claim verification process
- **Beneficiary Payouts**: Automatic distribution to registered beneficiaries
- **Transaction Tracking**: Complete audit trail for all transactions

### 🔒 Security & Compliance
- **Blockchain Security**: Policies backed by smart contracts
- **HMAC Authentication**: Secure API communication with Juno
- **Data Encryption**: Protected user information storage
- **Audit Logging**: Comprehensive system activity tracking

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Modern component library
- **React Hook Form**: Form management with validation

### Backend
- **Next.js API Routes**: Serverless backend functions
- **LowDB**: JSON-based database for development
- **Zod**: Schema validation
- **UUID**: Unique identifier generation

### Integration
- **Juno API**: Bitso's infrastructure for MXN/MXNB operations
- **CryptoJS**: HMAC signature generation
- **Arbitrum**: Blockchain network for MXNB tokens

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Juno API credentials (for production mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insurance-dapp
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Application Mode (mock or production)
   MODE=mock
   
   # Juno API Configuration
   JUNO_API_KEY=your_juno_api_key_here
   JUNO_API_SECRET=your_juno_api_secret_here
   JUNO_CLABE=your_juno_clabe_here
   
   # Juno API URLs
   JUNO_BASE_URL_STAGE=https://stage.buildwithjuno.com
   JUNO_BASE_URL_PROD=https://api.buildwithjuno.com
   
   # Database Configuration
   DATABASE_URL=file:./dev.db
   
   # Next.js Configuration
   NEXTAUTH_SECRET=your_nextauth_secret_here
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Initialize the database**
   ```bash
   mkdir -p data
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Modes

#### Mock Mode (`MODE=mock`)
- Simulated Juno API responses
- Local JSON database
- Fake transaction processing
- Perfect for development and testing

#### Production Mode (`MODE=production`)
- Real Juno API integration
- Actual CLABE creation and transactions
- MXNB token minting on Arbitrum
- Requires valid Juno credentials

### Juno API Setup

1. **Get API Credentials**
   - Visit [Juno Documentation](https://docs.bitso.com/juno/docs/getting-started)
   - Follow the [credential generation guide](https://docs.bitso.com/juno/docs/2-generate-your-api-credentials)

2. **Configure Authentication**
   - Set `JUNO_API_KEY` and `JUNO_API_SECRET` in your environment
   - Ensure proper HMAC signature generation (handled automatically)

3. **Test Integration**
   - Start with stage environment
   - Create test CLABEs and deposits
   - Verify MXNB minting functionality

## API Endpoints

### Policy Management

#### Create Policy
```http
POST /api/policies/create
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "5555551234",
  "birthDate": "1990-01-15",
  "gender": "male",
  "address": "Calle Principal 123",
  "city": "México",
  "state": "cdmx",
  "postalCode": "12345",
  "coverageType": "standard",
  "coverageAmount": 250000,
  "beneficiaries": [
    {
      "firstName": "María",
      "lastName": "Pérez",
      "relationship": "spouse",
      "percentage": 100,
      "email": "maria@example.com"
    }
  ]
}
```

### Claims Processing

#### Submit Claim
```http
POST /api/claims/process
Content-Type: application/json

{
  "policyNumber": "EL-12345678-ABCD",
  "deathCertificateUrl": "https://example.com/certificate.pdf",
  "additionalDocuments": ["https://example.com/doc1.pdf"]
}
```

#### Update Claim Status (Admin)
```http
PUT /api/claims/process?id=claim_id
Content-Type: application/json

{
  "status": "approved",
  "reviewNotes": "Documentation verified and approved"
}
```

### Juno Integration

#### List CLABEs
```http
GET /api/juno/clabe/route
```

#### Create Mock Deposit
```http
POST /api/juno/deposits/mock/route
Content-Type: application/json

{
  "clabe_id": "clabe_12345",
  "amount": "1000.00",
  "currency": "MXN",
  "reference": "Premium Payment",
  "sender_name": "Juan Pérez"
}
```

## Database Schema

### Entities

#### Policy
- User information (name, email, phone, birth date, gender)
- Address details (address, city, state, postal code)
- Policy specifics (coverage type, amount, premium)
- Payment information (CLABE ID, payment method)
- Status tracking (pending, active, expired, claimed)

#### Beneficiary
- Personal information (name, relationship, percentage)
- Contact details (email, phone, address)
- Identification (ID type and number)
- Policy association

#### Claim
- Claim details (type, amount, documentation)
- Status workflow (submitted → under_review → approved/rejected → paid)
- Payment information (method, transaction ID)
- Review notes and timestamps

#### Juno Transaction
- Transaction metadata (type, amount, currency)
- Juno-specific fields (transaction ID, status, CLABE ID)
- Relationship to policies and claims

## Premium Calculation

The premium calculation algorithm considers multiple factors:

### Base Formula
```
Premium = Coverage Amount × Base Rate × Age Multiplier × Gender Multiplier × Region Multiplier
```

### Multipliers
- **Age Groups**: 18-25 (0.8), 26-35 (0.9), 36-45 (1.0), 46-55 (1.3), 56-65 (1.6), 66+ (2.0)
- **Gender**: Male (1.1), Female (0.95), Other (1.0)
- **Regions**: CDMX (1.2), Jalisco (1.0), Nuevo León (1.1), Yucatán (0.9), Puebla (0.95)

### Coverage Types
- **Basic**: $100,000 MXN
- **Standard**: $250,000 MXN
- **Premium**: $500,000 MXN
- **Platinum**: $1,000,000 MXN

## Security Considerations

### API Security
- HMAC-SHA256 signature verification for Juno API
- Request timestamping to prevent replay attacks
- Environment-based configuration management

### Data Protection
- No sensitive data in client-side code
- Secure file upload handling
- Comprehensive audit logging

### Blockchain Security
- MXNB tokens backed by MXN reserves
- Smart contract interactions through Juno
- Immutable transaction records

## Development

### Project Structure
```
insurance-dapp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── checkout/          # Policy purchase page
│   ├── claims/            # Claims submission page
│   └── dapp/              # Main dashboard
├── components/            # React components
│   ├── ui/                # Shadcn UI components
│   └── ...                # Page-specific components
├── lib/                   # Utility libraries
│   ├── database/          # Database schema and connection
│   ├── juno/              # Juno API integration
│   └── services/          # Business logic services
├── data/                  # JSON database storage
└── public/                # Static assets
```

### Adding New Features

1. **Create Database Schema**
   - Add interface to `lib/database/schema.ts`
   - Update default database structure

2. **Implement Service Layer**
   - Add service class to `lib/services/database.ts`
   - Include validation and business logic

3. **Create API Endpoints**
   - Add route handler in `app/api/`
   - Implement proper error handling

4. **Build UI Components**
   - Create reusable components
   - Add form validation with Zod

### Testing

#### Mock Mode Testing
```bash
# Set environment to mock mode
export MODE=mock

# Test policy creation
curl -X POST http://localhost:3000/api/policies/create \
  -H "Content-Type: application/json" \
  -d @test-policy.json

# Test claim submission
curl -X POST http://localhost:3000/api/claims/process \
  -H "Content-Type: application/json" \
  -d @test-claim.json
```

## Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   MODE=production
   JUNO_API_KEY=your_production_api_key
   JUNO_API_SECRET=your_production_api_secret
   JUNO_BASE_URL_PROD=https://api.buildwithjuno.com
   ```

2. **Database Migration**
   - Replace LowDB with PostgreSQL for production
   - Set up proper database connection
   - Implement data migration scripts

3. **Security Hardening**
   - Enable HTTPS
   - Set up rate limiting
   - Configure CORS policies
   - Implement input sanitization

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **Documentation**: [Juno API Docs](https://docs.bitso.com/juno/docs/getting-started)
- **Issues**: Create an issue in this repository
- **Email**: support@extralife.com (placeholder)

## Roadmap

### Phase 1 - MVP ✅
- [x] Policy creation and management
- [x] Beneficiary registration
- [x] Claims processing workflow
- [x] Juno API integration
- [x] Mock mode for development

### Phase 2 - Enhanced Features
- [ ] Multi-language support (Spanish/English)
- [ ] Advanced claim verification
- [ ] Mobile app development
- [ ] Integration with additional payment methods

### Phase 3 - Scale & Optimize
- [ ] PostgreSQL database migration
- [ ] Advanced analytics dashboard
- [ ] Automated underwriting
- [ ] Integration with external medical data

---

**Built with ❤️ for the Mexican insurance market** 