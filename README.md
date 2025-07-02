# 🏠🤖 Home Assistant Config Optimizer

**AI-Powered Configuration Analysis and Optimization for Home Assistant**

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com/rickoslyder/ha-config-optimizer)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2023.1+-blue)](https://www.home-assistant.io)
[![OpenAI Tested](https://img.shields.io/badge/Tested%20with-OpenAI%20o1--mini-orange)](https://openai.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com)

> **✅ FULLY IMPLEMENTED** - Transform your Home Assistant configuration with AI-powered analysis that suggests optimizations, generates automations, and maintains complete user control over all changes.

## ✨ Features

### 🔍 **AI-Powered Analysis**
- **Multi-LLM Support**: OpenAI (GPT-4, o1-mini), Claude, Groq, Ollama, and custom providers
- **Dual Analysis Types**: Configuration optimization + automation suggestions
- **Real-time Processing**: Live progress tracking with automatic UI updates
- **Intelligent Chunking**: Handles large configurations within LLM context limits

### 📊 **Professional Dashboard**
- **Modern UI**: LitElement TypeScript SPA with Home Assistant theming
- **Four Main Views**:
  - **Optimizations**: AI-generated configuration improvements with diff viewer
  - **Automations**: Smart automation suggestions with YAML viewer
  - **Logs**: Complete scan history with real-time updates
  - **Settings**: LLM profiles and system configuration

### 🛡️ **Safety-First Design**
- **Three-Stage Workflow**: Suggest → Accept → Apply with explicit user control
- **Automatic Backups**: Created before any file modifications
- **YAML Validation**: Syntax checking before writing changes
- **Confirmation Dialogs**: Clear warnings before applying modifications

### ⚡ **Real-time Experience**
- **Live Progress Tracking**: Visual indicators with time estimates
- **Automatic Updates**: UI refreshes when scans complete
- **Background Processing**: Non-blocking scan execution
- **Status Monitoring**: Comprehensive logging and progress reporting

## 🚀 Quick Start

### Prerequisites
- Home Assistant Core 2023.1+
- Python 3.12+ (for development)
- LLM Provider API key (OpenAI recommended)

### Installation Options

#### Option 1: Development Setup
```bash
# 1. Clone and setup
git clone https://github.com/rickoslyder/ha-config-optimizer.git
cd ha-config-optimizer
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
echo "OPENAI_API_KEY=your-key-here" > .env

# 3. Start the application
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Test the system
python3 test_scan.py

# 5. Open browser
open http://localhost:8000
```

#### Option 2: Docker
```bash
docker build -t ha-config-optimizer .
docker run -p 8000:8000 -v /path/to/ha-config:/config ha-config-optimizer
```

### First Run Workflow

1. **Configure LLM Provider** → Settings tab → Enter API key → Test connection
2. **Run First Scan** → Optimizations tab → Click "🔍 Run Scan" → Watch progress
3. **Review Suggestions** → Click "View Diff" → Accept improvements
4. **Apply Changes** → Click "✨ Apply Changes" → Confirm with automatic backup

## 🏗️ Architecture

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + SQLite
- **Frontend**: LitElement TypeScript SPA with Home Assistant theming
- **Real-time Updates**: Polling-based monitoring with automatic refresh
- **Database**: SQLite for local data storage with full schema
- **LLM Integration**: Multi-provider abstraction with tested o1-mini support

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