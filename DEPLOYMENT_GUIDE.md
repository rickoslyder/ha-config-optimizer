# 🚀 Home Assistant Add-on Deployment Guide

## Overview

This guide covers how to deploy the LLM Config Optimizer as a proper Home Assistant add-on using the automated Samba deployment system.

## Prerequisites

1. **Home Assistant** with Samba add-on installed and configured
2. **Python 3.8+** on your development machine
3. **Network access** to your Home Assistant instance
4. **Samba credentials** for your Home Assistant

## Quick Start

### 1. First-Time Setup

```bash
# Install deployment dependencies
pip3 install -r deploy_requirements.txt

# Run initial deployment (will prompt for Samba credentials)
./deploy.sh
```

### 2. Development Workflow

```bash
# Deploy and watch for changes (auto-redeploy on file modifications)
./deploy.sh --watch

# Deploy only configuration files (faster for config changes)
./deploy.sh --config-only

# Clean deployment (removes existing addon first)
./deploy.sh --clean
```

### 3. VS Code Integration

Use **Ctrl+Shift+P** → **Tasks: Run Task** → Select:
- **Deploy to Home Assistant** - One-time deployment
- **Deploy and Watch** - Auto-deploy on changes
- **Deploy Config Only** - Config files only
- **Clean Deploy** - Clean and full deploy

## Deployment Process

### What Gets Deployed

**Included Files:**
- `config.yaml` - Add-on configuration
- `build.yaml` - Build configuration
- `Dockerfile` - Container definition
- `rootfs/` - S6 supervisor scripts
- `app/` - Python backend (all .py files)
- `ui/src/` - TypeScript frontend source
- `ui/package.json` - Frontend dependencies
- `requirements.txt` - Python dependencies
- Documentation files (`DOCS.md`, `CHANGELOG.md`)

**Excluded Files:**
- Development files (`venv/`, `node_modules/`, `.git/`)
- Built artifacts (`ui/build/`, `data/`)
- Test files and documentation
- This deployment script itself

### Automated Features

- **Smart File Filtering**: Only deploys necessary files
- **Frontend Building**: Automatically builds UI in the addon
- **Credential Caching**: Saves Samba configuration for reuse
- **Change Detection**: Watches for file modifications
- **Debounced Deployment**: Prevents rapid re-deployments

## Home Assistant Installation

After deployment to Samba:

1. **Navigate to Add-ons**:
   - Settings → Add-ons → Add-on Store

2. **Install the Add-on**:
   - Look for "LLM Config Optimizer" in Local add-ons
   - Click "Install"

3. **Configure**:
   - Set log level and options in Configuration tab
   - Start the add-on

4. **Access**:
   - Click "Open Web UI" or use the Home Assistant sidebar

## Configuration Options

### Deployment Configuration

Create `deploy_config.json` to customize:

```json
{
  "samba_host": "samba.richardbankole.com",
  "samba_share": "addons",
  "samba_user": "your-username"
}
```

### Add-on Configuration

In Home Assistant add-on configuration:

```yaml
log_level: info
auto_backup: true
max_file_size_mb: 10
```

## Troubleshooting

### Common Issues

**"Mount failed"**
- Check Samba credentials
- Verify Home Assistant Samba add-on is running
- Ensure network connectivity

**"Permission denied"**
- Check Samba user has write access to addons directory
- Verify Home Assistant addon directory exists

**"Add-on not appearing"**
- Refresh Home Assistant add-on store
- Check deployment completed successfully
- Verify files were copied to correct location

**"Build failed in Home Assistant"**
- Check add-on logs in Home Assistant
- Verify all required files were deployed
- Check for missing dependencies

### Development Tips

1. **Use Watch Mode**: `./deploy.sh --watch` for active development
2. **Config-Only Deploys**: Use `--config-only` for quick config changes
3. **Clean Deploys**: Use `--clean` when changing file structure
4. **Check Logs**: Monitor Home Assistant add-on logs for issues

## Security Considerations

- **Credentials**: Samba password is never saved to disk
- **File Filtering**: Only necessary files are deployed
- **Network Security**: Uses encrypted Samba connections
- **Isolation**: Add-on runs in isolated container environment

## Advanced Usage

### Custom Samba Configuration

For different Samba setups, modify the `Config` class in `deploy.py`:

```python
class Config:
    def __init__(self):
        self.samba_host = "your-ha-host.com"
        self.samba_share = "custom-share"
        # ... other settings
```

### Automated CI/CD

The deployment script can be integrated into CI/CD pipelines:

```bash
# Automated deployment (provide credentials via environment)
export SAMBA_USER="automation"
export SAMBA_PASSWORD="secret"
python3 deploy.py --clean
```

### Multi-Instance Deployment

Deploy to multiple Home Assistant instances:

```bash
# Deploy to different instances
python3 deploy.py --config-file=ha1_config.json
python3 deploy.py --config-file=ha2_config.json
```

## Next Steps

1. **Test the Add-on**: Verify installation and basic functionality
2. **Configure LLM Provider**: Set up OpenAI, Claude, or other providers
3. **Run First Scan**: Test the AI analysis functionality
4. **Setup Automation**: Consider scheduled scans for ongoing optimization

## Support

- **GitHub Issues**: https://github.com/rickoslyder/ha-config-optimizer/issues
- **Documentation**: See `DOCS.md` for user guide
- **Development**: See `CLAUDE.md` for technical details