# Metric Governance App

A Streamlit application for managing metric definitions, with GitHub integration for version control and Growthbook integration for experimentation.

## Setup

### Prerequisites

- Python 3.11 or higher
- Virtual environment
- GitHub account with access to the target repository
- GitHub App configured for user authentication
- Growthbook account (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone org-49461806@github.com:squareup/forge-sq-experimentation.git
   cd metric-governance-dev
   ```

2. Create and activate a virtual environment with Python 3.11:
   ```bash
   # Create virtual environment with Python 3.11
   python3.11 -m venv venv
   
   # Activate the virtual environment
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Verify Python version
   python --version  # Should show Python 3.11.x
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```bash
   # GitHub Configuration
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   GITHUB_REDIRECT_URI="http://localhost:8503/"  # Local development
   GITHUB_REPO_OWNER="squareup"
   GITHUB_REPO_NAME="forge-sq-experimentation"

   # Growthbook Configuration
   GROWTHBOOK_API_HOST="https://growthbook.sqprod.co"
   GROWTHBOOK_PAT="your_growthbook_personal_access_token"

   ```

5. Run the application:
   ```bash
   # Run in development mode 
   ./run_app.sh --dev
   
   # Run in production mode (uses Growthbook API)
   ./run_app.sh
   ```

## GitHub App Setup

This application uses GitHub App user authentication (OAuth flow) to interact with GitHub repositories.

### Creating a GitHub App

1. Go to your GitHub profile settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the required fields:
   - **Name**: `Metric Governance App` (or your preferred name)
   - **Homepage URL**: `http://localhost:8503/` (for local development)
   - **Callback URL**: `http://localhost:8503/` (for local development)
   - **Request user authorization (OAuth) during installation**: Check this box
   - **Webhook**: Uncheck "Active" (not needed for this app)
   - **Permissions**:
     - Repository permissions:
       - Contents: Read & Write
       - Pull requests: Read & Write
     - Organization permissions:
       - Members: Read
   - **Where can this GitHub App be installed?**: Your organization only

4. After creating the app, note the Client ID and generate a Client Secret
5. Install the app on your organization or personal account

### Environment Configuration

The application uses environment variables for configuration. These can be set in two ways:

1. **Development**: Using a `.env` file in the root directory
2. **Production**: Using Databricks secrets and environment variables

#### Local Development
Create a `.env` file with your credentials (see Setup section above)

#### Databricks Deployment
Configure the following in your `app.yaml`:
```yaml
env:
  - name: GITHUB_CLIENT_ID
    valueFrom: github_client_id_resource
  - name: GITHUB_CLIENT_SECRET
    valueFrom: github_client_secret_resource
  - name: GROWTHBOOK_PAT
    valueFrom: growthbook_pat_resource
  - name: GROWTHBOOK_API_HOST
    value: "https://growthbook.sqprod.co"
  - name: GITHUB_REDIRECT_URI
    value: "https://block-lakehouse-production.cloud.databricks.com/apps/metric-governance-app"
  - name: GITHUB_REPO_OWNER
    value: "squareup"
  - name: GITHUB_REPO_NAME
    value: "forge-sq-experimentation"
```

## Development

### Development vs. Production Mode

The application can run in two modes:

#### Development Mode (`--dev`)
- Sets `METRIC_APP_DEV_MODE="true"` in the environment
- Uses local files for metric data:
  - Growthbook metrics from `./growthbook/metrics/metrics_data.json`
  - GitHub metrics from `./metrics/github_metrics_data.json`
- No GitHub authentication or API connections required
- Perfect for UI development and metric processing logic

**Important Local Development Limitations:**
1. GitHub Authentication:
   - GitHub OAuth authentication will NOT work locally
   - This is because the GitHub App callback URL must point to the Databricks hosted URL
   - Use local metric files instead of GitHub repository connections

2. Local Metric Files:
   - For Growthbook source: Uses `./growthbook/metrics/metrics_data.json`
   - For GitHub source: Uses `./metrics/github_metrics_data.json`
   - To update local files:
     ```bash
     # For GitHub metrics
     python3 scripts/consolidate_github_metrics.py
     ```

3. Recommended Local Development Workflow:
   - Make code changes locally
   - Test with local metric files using `./run_app.sh --dev`
   - Deploy to Databricks to test GitHub integration features
   - Keep local metric files up to date with scripts

#### Production Mode
- Sets `METRIC_APP_DEV_MODE="false"` in the environment
- Starts with no metrics loaded
- Requires explicit selection of a data source (Growthbook API or GitHub)
- Full GitHub authentication and API integration
- Provides clearer error messages when data sources are unavailable
- Recommended for deployment environments

To switch between modes:
```bash
# Development mode
./run_app.sh --dev

# Production mode
./run_app.sh
```

### Directory Structure

```
metric-governance-dev/
├── growthbook/           # Growthbook API and metrics
│   ├── api.py           # Growthbook API integration
│   └── metrics/         # Local metric definitions
│       └── metrics_data.json  # Consolidated metrics file
├── metrics/              # Metric definitions for GitHub
├── modules/              # Application modules
├── templates/            # Template files
├── .env                 # Local environment variables
├── app.py               # Main application
├── app.yaml             # Databricks app configuration
├── databricks.yaml      # Databricks bundle configuration
├── requirements.txt     # Dependencies
└── run_app.sh           # Startup script
```

### Adding Features

1. Create a new branch
2. Make your changes
3. Test locally with `./run_app.sh --dev`
4. Submit a pull request

## Troubleshooting

### GitHub Authentication Issues

- Ensure your GitHub App is properly configured
- Check that the callback URL matches your deployment environment
- For organization access, ensure SAML SSO is enabled for the OAuth token

### Environment Variable Issues

- For local development:
  - Ensure `.env` file exists and contains all required variables
  - Check that `run_app.sh` is loading the variables correctly
  - Verify dev mode setting with `echo $METRIC_APP_DEV_MODE`

- For Databricks deployment:
  - Verify secrets are properly set in the Databricks secrets scope
  - Check `app.yaml` environment variable configuration
  - Ensure resource references match the secret names

### Growthbook Connection Issues

- Verify your API host is correct (`https://growthbook.sqprod.co`)
- Ensure your PAT has the necessary permissions
- Check the app logs for detailed error messages

### Local Development

When running locally:
1. Make sure your `.env` file is properly configured
2. Use `--dev` flag for local metric files: `./run_app.sh --dev`
3. Check environment variables are loaded: `env | grep -E "GITHUB_|GROWTHBOOK_|METRIC_APP_"`
