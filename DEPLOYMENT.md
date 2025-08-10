# Deployment Guide for Render.com

This guide walks you through deploying the Enhanced Chat Platform on Render.com.

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Render.com Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a free cluster at [mongodb.com](https://www.mongodb.com/atlas)
4. **Clerk Account**: Set up authentication at [clerk.com](https://clerk.com)

## Step 1: Prepare Your Environment Variables

### MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist all IP addresses (0.0.0.0/0) for Render
4. Get your connection string

### Clerk Setup
1. Create a new Clerk application
2. Get your publishable key and secret key
3. Configure allowed origins in Clerk dashboard

## Step 2: Deploy Using render.yaml (Recommended)

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect to Render**: 
   - Go to Render.com dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file automatically

3. **Set Environment Variables**:
   ```
   Backend Service:
   - MONGODB_URI: your_mongodb_atlas_connection_string
   - CLERK_SECRET_KEY: your_clerk_secret_key
   - JWT_SECRET: generate_a_random_32_character_string
   - CORS_ORIGIN: https://your-frontend-url.onrender.com
   
   Frontend Service:
   - VITE_API_URL: https://your-backend-url.onrender.com
   - VITE_CLERK_PUBLISHABLE_KEY: your_clerk_publishable_key
   ```

4. **Deploy**: Click deploy and wait for both services to build

## Step 3: Manual Deployment (Alternative)

### Backend Deployment

1. **Create Web Service**:
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Root directory: `backend`

2. **Configure Build Settings**:
   ```
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```

3. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   CLERK_SECRET_KEY=your_clerk_secret_key
   JWT_SECRET=your_jwt_secret_32_characters_long
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

### Frontend Deployment

1. **Create Static Site**:
   - Go to Render dashboard
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Root directory: `frontend`

2. **Configure Build Settings**:
   ```
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Add Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

## Step 4: Post-Deployment Configuration

### Update Clerk Settings
1. Go to your Clerk dashboard
2. Update allowed origins to include your Render URLs:
   - `https://your-frontend-url.onrender.com`
   - `https://your-backend-url.onrender.com`

### Update CORS Settings
1. The backend will automatically use the `CORS_ORIGIN` environment variable
2. Ensure it matches your frontend URL exactly

### Test Your Deployment
1. Visit your frontend URL
2. Try to sign up/sign in
3. Test creating a chat and sending messages
4. Verify real-time functionality works

## Step 5: Custom Domain (Optional)

1. **Purchase Domain**: Buy a domain from any registrar
2. **Configure DNS**: 
   - Add CNAME record pointing to your Render app
   - Example: `chat.yourdomain.com` → `your-app.onrender.com`
3. **Update Render Settings**:
   - Go to your service settings
   - Add custom domain
   - Render will automatically provision SSL certificate

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Connection Issues**:
   - Verify MongoDB connection string
   - Check if MongoDB Atlas allows connections from anywhere
   - Ensure environment variables are set correctly

3. **Authentication Problems**:
   - Verify Clerk keys are correct
   - Check allowed origins in Clerk dashboard
   - Ensure CORS settings are properly configured

4. **Real-time Features Not Working**:
   - Check if WebSocket connections are allowed
   - Verify Socket.IO client connects to correct backend URL
   - Check browser console for connection errors

### Logs and Monitoring

1. **Backend Logs**: Available in Render dashboard under your web service
2. **Frontend Logs**: Check browser console for client-side errors
3. **Database Logs**: Available in MongoDB Atlas dashboard

## Environment Variables Reference

### Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
CLERK_SECRET_KEY=sk_test_...
JWT_SECRET=your-secret-key-32-characters-long
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

### Frontend
```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Security Considerations

1. **Environment Variables**: Never commit sensitive keys to Git
2. **CORS**: Only allow your frontend domain
3. **MongoDB**: Use strong passwords and restrict IP access when possible
4. **Clerk**: Regularly rotate your secret keys
5. **HTTPS**: Render provides free SSL certificates automatically

## Performance Optimization

1. **MongoDB**: Use indexes for frequently queried fields
2. **Frontend**: Code splitting and lazy loading are already configured
3. **Caching**: Render provides CDN caching for static assets
4. **Monitoring**: Use Render's metrics to monitor performance

## Scaling

1. **Backend**: Upgrade Render plan for more resources
2. **Database**: Upgrade MongoDB Atlas cluster for more storage/performance
3. **Real-time**: Socket.IO automatically handles multiple server instances
4. **Load Balancing**: Render handles this automatically

## Support

If you encounter issues:
1. Check Render documentation
2. Review application logs
3. Test locally first
4. Contact support if needed

## Next Steps

After successful deployment:
1. Set up monitoring and alerts
2. Configure analytics (optional)
3. Plan for scaling
4. Consider backup strategies
5. Set up staging environment
