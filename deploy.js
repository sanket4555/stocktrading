const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const config = {
  appName: 'stock-trading-app',
  region: 'us-east-1', // Default region
  mongoUri: '',
  jwtSecret: '',
  domainName: '',
  s3BucketName: '',
  useElasticBeanstalk: false,
  useAmplify: false,
};

// Utility functions
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function createEnvFile(envVars, filePath) {
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(filePath, envContent);
  console.log(`Created ${filePath}`);
}

function updateApiUrl(useProduction) {
  const apiUrlPattern = /const API_URL = ['"]http:\/\/localhost:5000\/api['"]/g;
  const newApiUrl = useProduction 
    ? `const API_URL = '${config.apiEndpoint}/api'` 
    : "const API_URL = 'http://localhost:5000/api'";
  
  const jsFiles = [
    'frontend/public/js/auth.js',
    'frontend/public/js/portfolio.js',
    'frontend/public/js/profile.js',
    'frontend/public/js/transactions.js',
  ];
  
  jsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(apiUrlPattern, newApiUrl);
      fs.writeFileSync(filePath, content);
      console.log(`Updated API URL in ${file}`);
    }
  });
}

// Deployment functions
async function setupConfig() {
  console.log('=== AWS Deployment Configuration ===');
  
  config.region = await prompt(`AWS Region (default: ${config.region}): `) || config.region;
  config.mongoUri = await prompt('MongoDB URI (Atlas or EC2): ');
  config.jwtSecret = await prompt('JWT Secret for production: ') || 'stock2traderapp_secure_key_2024';
  config.domainName = await prompt('Domain name (optional): ');
  config.s3BucketName = await prompt('S3 bucket name for frontend: ') || `${config.appName}-frontend`;
  
  const deploymentType = await prompt('Deployment type (1 for EC2+S3, 2 for Elastic Beanstalk+Amplify): ');
  config.useElasticBeanstalk = deploymentType === '2';
  config.useAmplify = deploymentType === '2';
  
  config.apiEndpoint = config.domainName 
    ? `https://api.${config.domainName}` 
    : `http://${config.appName}-api.${config.region}.elasticbeanstalk.com`;
  
  console.log('\nConfiguration complete!\n');
}

function prepareBackend() {
  console.log('=== Preparing Backend for Deployment ===');
  
  // Create production env file
  const envVars = {
    PORT: 5000,
    MONGO_URI: config.mongoUri,
    JWT_SECRET: config.jwtSecret,
    NODE_ENV: 'production',
  };
  
  createEnvFile(envVars, path.join(__dirname, '.env.production'));
  
  // Create Elastic Beanstalk configuration if needed
  if (config.useElasticBeanstalk) {
    const ebConfig = {
      AWSEBDockerrunVersion: '1',
      Image: {
        Name: `${config.appName}:latest`,
        Update: 'true'
      },
      Ports: [
        {
          ContainerPort: 5000,
          HostPort: 80
        }
      ],
      Logging: '/var/log/nodejs'
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'Dockerrun.aws.json'),
      JSON.stringify(ebConfig, null, 2)
    );
    console.log('Created Elastic Beanstalk configuration');
  }
  
  console.log('Backend preparation complete!');
}

function prepareFrontend() {
  console.log('=== Preparing Frontend for Deployment ===');
  
  // Update API URLs in frontend files
  updateApiUrl(true);
  
  console.log('Frontend preparation complete!');
}

async function deployToAWS() {
  console.log('=== Deploying to AWS ===');
  
  try {
    // Check if AWS CLI is installed
    execSync('aws --version');
    console.log('AWS CLI is installed');
    
    // Check if user is logged in
    execSync('aws sts get-caller-identity');
    console.log('AWS credentials are configured');
    
    if (config.useElasticBeanstalk) {
      console.log('\nTo deploy to Elastic Beanstalk, run:');
      console.log('1. eb init -p node.js --region ' + config.region);
      console.log('2. eb create ' + config.appName + '-env');
    } else {
      console.log('\nTo deploy backend to EC2, follow these steps:');
      console.log('1. Launch an EC2 instance');
      console.log('2. SSH into your instance');
      console.log('3. Clone your repository');
      console.log('4. Copy the .env.production file');
      console.log('5. Run: npm install && npm install -g pm2');
      console.log('6. Run: pm2 start backend/server.js --name "' + config.appName + '"');
    }
    
    if (config.useAmplify) {
      console.log('\nTo deploy frontend to Amplify:');
      console.log('1. Go to AWS Amplify console');
      console.log('2. Connect your repository');
      console.log('3. Follow the setup wizard');
    } else {
      console.log('\nTo deploy frontend to S3:');
      console.log('1. Create S3 bucket: aws s3 mb s3://' + config.s3BucketName);
      console.log('2. Enable static website hosting');
      console.log('3. Upload files: aws s3 sync ./frontend/public s3://' + config.s3BucketName);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Please install and configure AWS CLI before deploying');
  }
}

// Main function
async function main() {
  console.log('=== Stock Trading App AWS Deployment ===\n');
  
  await setupConfig();
  prepareBackend();
  prepareFrontend();
  await deployToAWS();
  
  console.log('\nDeployment preparation complete!');
  console.log('Follow the deployment guide for detailed instructions.');
  
  rl.close();
}

main().catch(console.error);
