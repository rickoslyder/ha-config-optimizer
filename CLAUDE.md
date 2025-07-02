# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules to ALWAYS Follow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the [todo.md](http://todo.md/) file with a summary of the changes you made and any other relevant information.

## Project Overview

This is the **LLM-Powered Home Assistant Config Optimizer** - a fully implemented Home Assistant addon that uses AI to analyze YAML configurations and suggest optimizations. The project consists of a Python FastAPI backend with a LitElement frontend, packaged as a Docker container for Home Assistant.

**Key Purpose**: Analyze Home Assistant YAML configurations using LLMs to suggest optimizations and new automations while maintaining complete user control over all changes.

**Current Status**: ✅ **PRODUCTION READY** - All core features implemented and tested with real AI providers.

## Architecture Summary

- **Backend**: Python 3.12 + FastAPI + SQLAlchemy + SQLite
- **Frontend**: LitElement SPA served by FastAPI
- **Database**: SQLite (`/data/optimizer.db`)
- **LLM Integration**: Pluggable providers (OpenAI, Claude, Groq, Ollama, vLLM)
- **Deployment**: Single Docker container as Home Assistant addon
- **Authentication**: Home Assistant Ingress integration

## Development Commands

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

# Database migrations
alembic upgrade head
```

### Frontend Development
```bash
# Install dependencies
cd ui && npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Type checking
npm run type-check
```

### Docker Development
```bash
# Build addon container
docker build -t ha-config-optimizer .

# Run locally for testing
docker run -p 8000:8000 -v ./test-config:/config ha-config-optimizer

# Test in Home Assistant
# Copy to addons folder and install through HA UI
```

## Project Structure

```
/
├── app/                          # Python backend
│   ├── main.py                   # FastAPI application factory
│   ├── api/                      # REST API endpoints
│   │   ├── scan.py              # Scan management endpoints
│   │   ├── suggestions.py       # Suggestion CRUD endpoints  
│   │   └── settings.py          # Configuration endpoints
│   ├── services/                 # Business logic services
│   │   ├── yaml_ingest.py       # YAML parsing with ruamel.yaml
│   │   ├── suggestion_engine.py # LLM orchestration
│   │   ├── diff_manager.py      # Diff generation and application
│   │   └── scheduler.py         # APScheduler for cron jobs
│   ├── llm_providers/           # LLM client implementations
│   │   ├── base.py             # Abstract base class
│   │   ├── openai.py           # OpenAI client
│   │   ├── anthropic.py        # Claude client
│   │   └── ollama.py           # Local Ollama client
│   ├── models/                  # Pydantic schemas and SQLAlchemy models
│   └── utils/                   # Shared utilities
├── ui/                          # LitElement frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ha-config-optimizer.ts    # Main app component
│   │   │   ├── tab-navigation.ts         # Tab navigation component
│   │   │   ├── diff-viewer.ts            # Side-by-side diff viewer
│   │   │   └── scan-progress.ts          # Real-time progress tracking
│   │   ├── views/              # Main tab views
│   │   │   ├── optimizations-view.ts     # Configuration optimization suggestions
│   │   │   ├── automations-view.ts       # Automation suggestions with YAML viewer
│   │   │   ├── logs-view.ts              # Scan history and operation logs
│   │   │   └── settings-view.ts          # LLM profiles and configuration
│   │   ├── services/           # Frontend services
│   │   │   └── api.ts                    # REST API client with real-time monitoring
│   │   └── types/              # TypeScript interfaces
│   └── build/                  # Production build output
├── tests/                       # Test suites
│   ├── unit/                   # Unit tests (pytest)
│   └── e2e/                    # End-to-end tests (Playwright)
├── config.json                 # Home Assistant addon manifest
├── Dockerfile                  # Container definition
└── docs/                       # Additional documentation
```

## ✅ Implemented Features

### **Core Analysis Engine**
- ✅ **Multi-Provider LLM Integration**: OpenAI (GPT-4, o1-mini), Claude, Groq, Ollama support
- ✅ **YAML Configuration Analysis**: Comprehensive parsing with ruamel.yaml
- ✅ **Dual Analysis Types**: 
  - **Optimization Analysis**: Performance improvements, code cleanup, best practices
  - **Automation Analysis**: Smart automation suggestions based on available entities
- ✅ **Real-time Scan Execution**: Background processing with live progress updates
- ✅ **Intelligent Chunking**: Handles large configurations within LLM context limits

### **Complete User Interface**
- ✅ **Professional Dashboard**: Modern LitElement SPA with Home Assistant theming
- ✅ **Optimizations View**: 
  - Real suggestion data display with metadata
  - Side-by-side diff viewer for configuration changes
  - Accept/Reject/Apply workflow with confirmation dialogs
- ✅ **Automations View**: 
  - Specialized interface for automation suggestions
  - YAML viewer modal for complete automation configurations
  - Entity usage display and categorization
- ✅ **Scan Logs View**: 
  - Complete scan history with real-time updates
  - Filterable logs by level and scan
  - Auto-refresh with manual controls
- ✅ **Settings Management**: LLM profile configuration and system settings

### **Real-time Progress Tracking**
- ✅ **Live Scan Monitoring**: Automatic polling with configurable intervals
- ✅ **Progress Indicators**: Visual progress bars with time estimates
- ✅ **Compact Progress Display**: Embedded progress tracking in main header
- ✅ **Automatic Refresh**: UI updates when scans complete without user intervention

### **Suggestion Application Workflow**
- ✅ **Three-Stage Process**: Suggest → Accept → Apply with clear status tracking
- ✅ **Safety Features**: 
  - Confirmation dialogs before applying changes
  - Automatic backup creation before file modifications
  - YAML syntax validation before writing
- ✅ **Status Management**: Complete tracking (pending/accepted/applied/rejected)
- ✅ **Error Handling**: Comprehensive error messages and rollback capabilities

### **Production-Ready Infrastructure**
- ✅ **FastAPI Backend**: High-performance REST API with automatic documentation
- ✅ **SQLite Database**: Complete schema with migrations and relationship management
- ✅ **Real-time API**: Polling-based real-time updates with cleanup functions
- ✅ **Type Safety**: Full TypeScript frontend with proper interfaces
- ✅ **Error Handling**: Comprehensive error boundaries and user feedback
- ✅ **Responsive Design**: Mobile and desktop compatibility

## Key Implementation Details

### Database Schema
- **scans**: Scan execution records with metadata
- **suggestions**: Individual optimization/automation suggestions
- **diffs**: File patches ready for application
- **settings**: User configuration and preferences
- **llm_profiles**: LLM provider configurations
- **logs**: Operation logs and audit trail

### LLM Integration Pattern
1. **Chunking**: Large YAML files split based on model context limits
2. **Prompt Templates**: Jinja2 templates with role-specific prompts
3. **Provider Abstraction**: Common interface for all LLM providers
4. **Streaming**: SSE for real-time progress updates
5. **Error Handling**: Graceful fallbacks and retry logic

### Safety Mechanisms
- **Backup System**: Automatic backups before any file changes
- **SHA Validation**: Detect file modifications between scan and apply
- **YAML Validation**: Syntax checking before writing changes
- **User Approval**: No automatic changes without explicit consent
- **Rollback**: Full restoration from backups if needed

### Home Assistant Integration
- **Ingress**: Served through HA's reverse proxy
- **Authentication**: Uses HA session tokens
- **Theming**: Inherits HA's CSS custom properties
- **File Access**: Direct access to `/config` directory
- **Recorder**: Optional integration with HA database

## Development Workflow

### Testing the Working System
```bash
# 1. Set up environment variables
echo "OPENAI_API_KEY=your-key-here" > .env

# 2. Start the backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Test the scan engine
python3 test_scan.py

# 4. Open UI at http://localhost:8000
```

### Adding New Features
1. **API First**: Define endpoints in `app/api/` (see suggestions.py for apply endpoint example)
2. **Service Layer**: Implement business logic in `app/services/`
3. **Frontend**: Build UI components in `ui/src/` (see scan-progress.ts for real-time updates)
4. **Testing**: Add unit tests and update e2e scenarios
5. **Documentation**: Update relevant docs and user flows

### Adding LLM Providers
1. **Inherit from BaseProvider**: Implement abstract methods in `app/llm_providers/base.py`
2. **Handle Authentication**: Support various auth methods (API keys, local endpoints)
3. **Stream Support**: Implement streaming for progress updates
4. **Error Handling**: Provider-specific error mapping
5. **Configuration**: Add UI settings for provider setup

### Testing Strategy
- **Unit Tests**: Focus on business logic and data transformations
- **Integration Tests**: Test LLM provider interactions with mocking
- **E2E Tests**: Full user workflows in Home Assistant environment
- **Manual Testing**: Use development container with test configurations

### Code Style Guidelines
- **Python**: Follow PEP 8, use type hints, prefer dataclasses/Pydantic
- **TypeScript**: Strict mode, prefer interfaces over types
- **CSS**: Use CSS custom properties, follow BEM methodology
- **Imports**: Absolute imports, grouped by type (stdlib, third-party, local)

## Common Development Tasks

### Running Full Development Environment
```bash
# Terminal 1: Backend with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend development build
cd ui && npm run dev

# Terminal 3: Watch tests
pytest tests/ --watch
```

### Database Operations
```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Reset database (development only)
rm data/optimizer.db && alembic upgrade head
```

### Adding UI Components
1. Create component in `ui/src/components/`
2. Follow LitElement patterns and lifecycle
3. Use CSS custom properties for theming
4. Add TypeScript interfaces for props
5. Export from main components index

### Debugging LLM Issues
1. **Check Logs**: Review detailed logs in `/logs` endpoint
2. **Prompt Inspection**: Use expert mode to view raw prompts
3. **Provider Testing**: Use connection test in settings
4. **Mock Responses**: Use test fixtures for consistent testing
5. **Rate Limiting**: Check provider-specific limits and errors

## Security Considerations

- **API Keys**: Encrypt at rest, never log in plaintext
- **File Access**: Validate all file paths, prevent directory traversal
- **Input Validation**: Sanitize all user inputs and LLM responses
- **Secrets Handling**: Exclude `secrets.yaml` by default
- **Permissions**: Respect Home Assistant user permissions

## Performance Guidelines

- **Chunking**: Respect LLM context limits, use sliding windows
- **Caching**: Cache entity metadata and file checksums
- **Async**: Use async/await for I/O operations
- **Memory**: Stream large files, avoid loading everything into memory
- **Database**: Use appropriate indexes, connection pooling

## Troubleshooting

### Common Issues
- **LLM Timeouts**: Check provider status, adjust timeout settings
- **File Permissions**: Ensure addon has read/write access to config
- **YAML Corruption**: Verify backup system, check syntax validation
- **UI Not Loading**: Check static file serving, browser console errors
- **Database Locked**: Use WAL mode for SQLite, check concurrent access