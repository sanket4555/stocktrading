# AWS Deployment Guide for Stock Trading App

This guide will walk you through deploying your MERN stack Stock Trading application to AWS.

## Prerequisites

1. AWS Account
2. AWS CLI installed and configured
3. Node.js and npm installed locally
4. MongoDB account (for MongoDB Atlas option)

## Deployment Options

### Option 1: Full AWS Deployment
- Backend: EC2 instance
- Database: MongoDB on EC2 or MongoDB Atlas
- Frontend: S3 + CloudFront

### Option 2: Simplified Deployment
- Backend: Elastic Beanstalk
- Database: MongoDB Atlas
- Frontend: Amplify

## Step 1: Prepare Your Application

### Update Environment Variables

Create a `.env.production` file in your project root:

```
PORT=5000
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=production
```

### Update API URLs in Frontend

Update all API URLs in your frontend code to use a variable base URL:

```javascript
// In frontend/public/js/auth.js and other files
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com/api' 
  : 'http://localhost:5000/api';
```

## Step 2: Set Up MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Set up database user and network access
4. Get your connection string
5. Update your `.env.production` file with the connection string

### Option B: MongoDB on EC2

1. Launch an EC2 instance for MongoDB
2. Install and configure MongoDB
3. Set up security groups and firewall rules
4. Connect your application to the MongoDB instance

## Step 3: Deploy Backend to EC2

1. Launch an EC2 instance (t2.micro for testing)
2. Connect to your instance via SSH
3. Install Node.js, npm, and other dependencies
4. Clone your repository
5. Install application dependencies
6. Set up environment variables
7. Use PM2 to run your application as a service

```bash
# Install Node.js and npm
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone your repository
git clone your-repository-url
cd stock-trading-app

# Install dependencies
npm install

# Set up environment variables
cp .env.production .env

# Start the application with PM2
pm2 start backend/server.js --name "stock-trading-app"
pm2 startup
pm2 save
```

## Step 4: Deploy Frontend to S3

1. Create an S3 bucket
2. Enable static website hosting
3. Set bucket policy for public access
4. Upload your frontend files

```bash
# Build your frontend (if using a build process)
npm run build

# Upload to S3
aws s3 sync ./frontend/public s3://your-bucket-name
```

## Step 5: Set Up CloudFront (Optional)

1. Create a CloudFront distribution
2. Point it to your S3 bucket
3. Configure HTTPS
4. Set up caching policies

## Step 6: Set Up Domain and DNS

1. Register a domain in Route 53 or use an existing domain
2. Create DNS records pointing to your services
3. Set up HTTPS certificates using AWS Certificate Manager

## Step 7: Configure Security

1. Set up proper security groups for EC2 instances
2. Configure CORS settings
3. Implement proper authentication and authorization
4. Set up AWS WAF for additional security (optional)

## Alternative: Deploy Using Elastic Beanstalk and Amplify

### Backend: Elastic Beanstalk

1. Install the EB CLI
2. Initialize your EB application
3. Deploy your application

```bash
# Install EB CLI
pip install awsebcli

# Initialize EB application
eb init

# Create an environment and deploy
eb create
```

### Frontend: AWS Amplify

1. Connect your repository to Amplify
2. Configure build settings
3. Deploy your frontend

## Monitoring and Maintenance

1. Set up CloudWatch for monitoring
2. Configure alarms for critical metrics
3. Set up automated backups for your database
4. Implement a CI/CD pipeline for continuous deployment

## Cost Optimization

1. Use t2.micro instances for development/testing
2. Implement auto-scaling for production
3. Use reserved instances for long-term cost savings
4. Monitor and optimize resource usage

## Troubleshooting

- Check EC2 instance logs: `/var/log/cloud-init-output.log`
- Check application logs using PM2: `pm2 logs`
- Verify security group settings
- Check network ACLs and route tables
- Verify MongoDB connection
