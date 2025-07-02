# Home Assistant Add-on: LLM Config Optimizer

## Installation

Add this repository to your Home Assistant add-on store:

1. Navigate to Settings > Add-ons > Add-on Store
2. Click the three dots menu (⋮) in the top right
3. Select "Repositories"
4. Add this URL: `https://github.com/rickoslyder/ha-config-optimizer`
5. Close the dialog and refresh the page
6. Find "LLM Config Optimizer" in the local add-ons section
7. Click "Install"

## Configuration

### Required Configuration

Before starting the add-on, you must configure at least one LLM provider:

```yaml
log_level: info
auto_backup: true
max_file_size_mb: 10
```

### LLM Provider Setup

After installation, navigate to the add-on's web interface to configure your AI provider:

1. **OpenAI**: Requires API key from OpenAI
   - Supports GPT-4, GPT-3.5-turbo, and o1-mini models
   - Recommended for best results

2. **Anthropic Claude**: Requires API key from Anthropic
   - Supports Claude-3 and Claude-2 models

3. **Groq**: Fast inference with open models
   - Free tier available with rate limits

4. **Local (Ollama)**: Run models locally
   - No API key required
   - Requires sufficient system resources

## Usage

### First-Time Setup

1. Start the add-on and open the web interface
2. Go to the Settings tab
3. Configure your preferred LLM provider
4. Test the connection
5. Review file inclusion/exclusion settings
6. Run your first scan from the Optimizations tab

### Running Scans

The add-on analyzes your Home Assistant configuration files and provides two types of suggestions:

**Configuration Optimizations:**
- Performance improvements
- Code cleanup and simplification
- Best practice recommendations
- Deprecated feature warnings

**Automation Suggestions:**
- New automation ideas based on your devices
- Optimizations for existing automations
- Entity usage recommendations

### Safety Features

**Automatic Backups:** Every time you apply changes, the add-on creates a backup of the original files in `/backup/llm-optimizer/`.

**Three-Stage Workflow:**
1. **Suggest**: AI analyzes your config and suggests improvements
2. **Accept**: You review and accept suggestions you want to apply
3. **Apply**: Changes are safely applied to your configuration files

**YAML Validation:** All changes are validated before being written to ensure your configuration remains valid.

### Real-Time Monitoring

- **Live Progress**: Watch scans progress in real-time
- **Automatic Updates**: UI refreshes when scans complete
- **Comprehensive Logs**: Track all operations and results

## File Access

The add-on has read/write access to:
- `/config`: Your Home Assistant configuration directory
- `/backup`: For creating automatic backups

Files excluded by default:
- `secrets.yaml` (for security)
- `known_devices.yaml` (typically auto-generated)
- Hidden files and directories (starting with `.`)

You can customize which files to include/exclude in the Settings tab.

## Troubleshooting

### Common Issues

**"No suggestions found"**
- Ensure your LLM provider is configured correctly
- Check that configuration files are included in the scan
- Verify your API key has sufficient credits/quota

**"LLM API Error"**
- Test your LLM connection in Settings
- Check your internet connection
- Verify your API key is valid and has quota

**"Configuration validation failed"**
- The add-on detected an issue with proposed changes
- Check the error message for specific details
- Your original configuration remains unchanged

**"Backup creation failed"**
- Ensure the add-on has write permissions to `/backup`
- Check available disk space
- Review the logs for specific error details

### Getting Help

1. **Check Logs**: View detailed logs in the add-on's Logs tab
2. **Test Integration**: Use the Settings tab to test your configuration
3. **GitHub Issues**: Report bugs at https://github.com/rickoslyder/ha-config-optimizer/issues

## Advanced Features

### Scheduled Scans

Configure automatic scans to run on a schedule:
- Navigate to Settings > Scheduled Scans
- Set your preferred frequency and time
- Choose notification preferences

### Expert Mode

Access advanced features in the Settings:
- View raw LLM responses
- Customize system prompts
- Detailed debugging information

### API Access

The add-on provides REST API endpoints at `/api/` for:
- Scan management
- Suggestion handling
- Configuration access
- Home Assistant integration

## Security Considerations

- **API Keys**: Stored encrypted in the add-on's data directory
- **File Access**: Limited to configuration and backup directories
- **Network**: Only communicates with configured LLM providers
- **Validation**: All changes are validated before application
- **Backups**: Automatic backup before any modifications

## Performance

- **Scan Time**: Typically 30-120 seconds for average configurations
- **File Size**: Supports configurations up to 10MB total
- **Memory**: Efficient processing with chunked analysis
- **CPU**: Minimal impact during normal operation

## Privacy

- **Local Processing**: Configuration analysis happens locally when possible
- **Data Transmission**: Only necessary configuration data sent to LLM providers
- **No Storage**: LLM providers do not store your configuration data
- **Encryption**: All API communications use HTTPS

For the most private setup, use local LLM providers like Ollama.