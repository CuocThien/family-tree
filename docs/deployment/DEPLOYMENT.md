# Deployment Guide

## Prerequisites

- MongoDB database (Atlas recommended)
- Hosting platform (Vercel, Netlify, or custom)
- Domain name (optional)
- OAuth credentials (for social login)

## Deploying to Vercel

### 1. Prepare for Deployment

1. Push code to GitHub
2. Ensure all environment variables are documented

### 2. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Whitelist all IPs (0.0.0.0/0) for Vercel
4. Get connection string

### 3. Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repository
4. Add environment variables:

```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

5. Click "Deploy"

### 4. Configure Custom Domain (Optional)

1. Go to project settings
2. Add custom domain
3. Update DNS records

## Deploying to Other Platforms

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### AWS

See detailed AWS deployment guide.

## Environment Variables Checklist

- [ ] MONGODB_URI
- [ ] NEXTAUTH_URL
- [ ] NEXTAUTH_SECRET
- [ ] GOOGLE_CLIENT_ID (optional)
- [ ] GOOGLE_CLIENT_SECRET (optional)
- [ ] FACEBOOK_CLIENT_ID (optional)
- [ ] FACEBOOK_CLIENT_SECRET (optional)
- [ ] SMTP_HOST (optional, for emails)
- [ ] SMTP_PORT (optional)
- [ ] SMTP_USER (optional)
- [ ] SMTP_PASSWORD (optional)

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Test tree creation
- [ ] Test person creation
- [ ] Test file uploads
- [ ] Verify OAuth callbacks
- [ ] Set up monitoring
- [ ] Configure backups
