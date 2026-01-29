# Development Setup Guide

## Local Development Setup

### 1. Install MongoDB

#### Option A: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create a cluster (free tier)
4. Get connection string

#### Option B: Local MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from [MongoDB website](https://www.mongodb.com/try/download/community)

**Linux:**
```bash
sudo apt-get install mongodb
```

### 2. Install Node.js

Use [nvm](https://github.com/nvm-sh/nvm) for version management:

```bash
nvm install 18
nvm use 18
```

### 3. Configure Environment Variables

Copy the example env file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values.

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add Facebook Login product
4. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and Secret to `.env.local`

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running: `mongosh` or connect via Atlas
- Check connection string in `.env.local`
- Check firewall settings for Atlas

### NextAuth Issues

- Verify NEXTAUTH_SECRET is set (generate with `openssl rand -base64 32`)
- Check NEXTAUTH_URL matches your domain

### Build Errors

- Delete `node_modules` and `next` cache: `rm -rf node_modules .next`
- Reinstall: `npm install`
