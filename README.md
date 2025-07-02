# LLM-Powered Home Assistant Config Optimizer

An AI-powered Home Assistant addon that analyzes YAML configurations and provides intelligent optimization suggestions while maintaining complete user control over all changes.

## Features

- 🔍 **YAML Analysis**: Deep analysis of Home Assistant configuration files
- 🤖 **AI-Powered Suggestions**: Uses state-of-the-art LLMs for optimization recommendations
- 🛡️ **Safe Operations**: All changes require explicit user approval with automatic backups
- ⚙️ **Multiple LLM Providers**: Support for OpenAI, Claude, Groq, Ollama, and custom endpoints
- 📊 **Usage Analytics**: Analyze entity usage patterns from Home Assistant recorder
- 🎯 **Automation Suggestions**: AI-generated automation ideas based on your devices and usage
- 🔧 **Interactive UI**: Home Assistant integrated web interface for reviewing and applying changes

## Architecture

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + SQLite
- **Frontend**: LitElement SPA with TypeScript
- **Deployment**: Docker container as Home Assistant addon
- **Database**: SQLite for local data storage
- **Authentication**: Home Assistant Ingress integration

## Development

### Backend Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run tests
pytest tests/ -v

# Type checking
mypy app/

# Linting
ruff check app/
ruff format app/
```

### Frontend Development

```bash
# Install dependencies
cd ui && npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

### Docker Development

```bash
# Build addon container
docker build -t ha-config-optimizer .

# Run locally for testing
docker run -p 8000:8000 -v ./test-config:/config ha-config-optimizer
```

## Project Structure

```
├── app/                    # Python FastAPI backend
│   ├── api/               # REST API endpoints
│   ├── services/          # Business logic services
│   ├── llm_providers/     # LLM client implementations
│   └── models/            # Database models and schemas
├── ui/                    # LitElement frontend
│   └── src/
│       ├── components/    # UI components
│       ├── views/        # Main tab views
│       └── services/     # Frontend services
├── tests/                 # Test suites
├── docs/                  # Documentation
├── config.json           # Home Assistant addon manifest
└── Dockerfile            # Container definition
```

## Documentation

- [Product Requirements Document](PRD.md)
- [User Flow Documentation](USER_FLOWS.md)
- [Branding & Style Guidelines](BRAND_GUIDELINES.md)
- [Technical Specification](technical_spec.md)
- [Development Guide](CLAUDE.md)

## Installation

### Home Assistant Add-on Store (Coming Soon)

The addon will be available through the Home Assistant Community Add-ons store.

### Manual Installation

1. Copy the project to your Home Assistant addons directory
2. Restart Home Assistant Supervisor
3. Install the addon through the Home Assistant UI
4. Configure your LLM provider in the addon settings
5. Start analyzing your configuration!

## Configuration

### LLM Providers

The addon supports multiple LLM providers:

- **OpenAI**: GPT-3.5, GPT-4, and other OpenAI models
- **Anthropic**: Claude models via API
- **Groq**: Fast inference with open models
- **Ollama**: Local LLM hosting
- **Custom**: Any OpenAI-compatible API endpoint

### File Selection

Configure which YAML files to analyze:

- **Include patterns**: `*.yaml`, `*.yml`, specific files
- **Exclude patterns**: `secrets.yaml`, `known_devices.yaml` (default)
- **Custom patterns**: Support for glob patterns and directory exclusions

### Scheduling

Set up automatic scans:

- **Cron expressions**: Standard cron syntax for scheduling
- **Notification options**: Email and Home Assistant notifications
- **Scan types**: Full analysis or optimization-only scans

## Safety & Security

- ❌ **No Auto-Apply**: All changes require explicit user approval
- 🔒 **Automatic Backups**: Files are backed up before any modifications
- 🔍 **Change Detection**: SHA-256 hashing prevents conflicts
- 🛡️ **Secrets Protection**: `secrets.yaml` excluded by default
- 🔄 **Rollback Support**: Full restoration from backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the development guidelines in [CLAUDE.md](CLAUDE.md)
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/rickoslyder/ha-config-optimizer/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/rickoslyder/ha-config-optimizer/discussions)
- 📖 **Documentation**: See the `docs/` directory