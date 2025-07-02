# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-01-02

### Added - Major UI/UX Enhancements 🎉
- **File Selector Component**: Interactive tree view with expand/collapse, file filtering, and "Select All" functionality
- **Real-time WebSocket Progress**: Live scan progress tracking with current file analysis and completion percentage
- **Bulk Operations**: Select multiple suggestions for batch accept/reject operations with confirmation dialogs
- **Export Functionality**: Export suggestions in JSON, CSV, and Markdown formats with selected or all suggestions
- **LLM Connection Testing**: "Test Connection" button in LLM profile modal with real API validation
- **Enhanced Error Handling**: User-friendly error messages with actionable suggestions for different failure scenarios
- **Loading States**: Visual loading indicators for all async operations with proper disabled states
- **API Key Encryption**: Secure storage of LLM API keys with automatic encryption and backward compatibility migration

### New Features
- **WebSocket Endpoint**: Real-time scan progress broadcasting with automatic connection management
- **Bulk Suggestion Management**: Checkbox selection, count tracking, and batch operations
- **Data Export System**: Multiple format support with proper file download handling
- **Error Recovery**: Comprehensive error classification and user guidance system
- **Cryptographic Security**: Industry-standard encryption for sensitive API keys
- **Connection Validation**: Live testing of LLM provider endpoints with detailed feedback

### Enhanced User Experience
- **Interactive File Selection**: Tree navigation with file metadata (size, modified date)
- **Live Progress Updates**: Real-time WebSocket updates with polling fallback
- **Visual Feedback**: Loading spinners, progress bars, and status indicators
- **Error Guidance**: Context-aware error messages with resolution suggestions
- **Batch Operations**: Efficient handling of multiple suggestions simultaneously
- **Secure Configuration**: Encrypted storage of sensitive configuration data

### Technical Improvements
- **WebSocket Integration**: FastAPI WebSocket support with connection management
- **Encryption Layer**: Cryptography-based secure key storage with PBKDF2 key derivation
- **Error Handling Framework**: Structured error parsing and user-friendly messaging
- **Loading State Management**: Centralized loading state tracking with automatic cleanup
- **File Tree API**: Hierarchical file structure with metadata for improved navigation
- **Export Utilities**: Client-side file generation and download with format validation

### Security Enhancements
- **API Key Protection**: Encrypted storage with automatic migration of existing keys
- **WebSocket Security**: Proper authentication and connection validation
- **Input Validation**: Enhanced validation for file paths and user inputs
- **Error Information**: Secure error handling without exposing sensitive details

### Testing & Quality
- **Integration Testing**: Comprehensive scan engine validation with real LLM providers
- **Error Scenarios**: Validated error handling across all user workflows
- **Security Testing**: Encryption implementation and WebSocket security validation
- **UI Testing**: All new components and interactions tested with real data

### Breaking Changes
- None - All changes are backward compatible

### Migration Notes
- API keys will be automatically encrypted on first startup
- WebSocket connections are optional - UI falls back to polling if unavailable
- All new features are additive and do not affect existing functionality

## [0.1.4] - 2025-01-02

### Added
- Comprehensive LLM provider reference guide (LLM_PROVIDERS.md) with latest models
- Modal dialog component for adding/editing LLM profiles
- Support for latest LLM models including OpenAI o4-mini, Claude 4, Gemini 2.5
- Update LLM profile functionality in settings view
- Visual provider presets for easy configuration

### Fixed
- Edit button in LLM providers section now opens modal dialog
- Add LLM Profile button now properly creates new profiles
- Settings view properly handles profile creation and updates

### Changed
- Updated default OpenAI model from gpt-3.5-turbo to gpt-o4-mini
- Increased default context tokens from 4000 to 128000
- Enhanced CLAUDE.md with reference to LLM providers guide

### Documentation
- Added comprehensive LLM_PROVIDERS.md with model specifications, pricing, and use cases
- Updated CLAUDE.md to reference the LLM providers guide for AI implementations

## [0.1.3] - 2025-01-02

### Fixed
- Fixed 404 errors for /health and /addon/info endpoints
- Moved static file mounting to the end to prevent catching API routes
- API routes are now properly accessible through Home Assistant Ingress

## [0.1.2] - 2025-01-02

### Fixed
- Fixed API health check returning 404 error in Ingress mode
- Changed to use relative URLs when in Home Assistant Ingress environment
- Fixed health check to use relative path 'health' instead of '/health'
- Added fallback to addon/info endpoint if health check fails
- Updated API service to use relative 'api' base URL in Ingress mode

## [0.1.1] - 2025-01-02

### Added
- Error handling and console logging for debugging initialization
- Loading indicator while the app initializes
- Clear error messages with reload button if API connection fails
- Automatic detection of Home Assistant Ingress environment
- Debug logging for API requests and connection status

### Fixed
- Fixed blank page issue when accessing Web UI through Home Assistant
- Fixed API base URL detection for Ingress compatibility
- Fixed asset loading by using relative paths in Vite configuration
- Fixed Python module structure by preserving app directory hierarchy
- Fixed module import paths in run script
- Fixed Docker build issues with Python dependencies
- Fixed frontend build by including package-lock.json
- Resolved npm ci failures by including dev dependencies

### Changed
- Switched to official Home Assistant Python base images
- Simplified Python package installation process
- Updated Dockerfile to use appropriate base images for each architecture
- Improved error messages and user feedback

### Security
- Removed .claude/settings.local.json from version control

## [0.1.0] - 2025-01-02

### Added
- **Home Assistant Add-on**: Complete conversion to proper HA add-on format
- **Ingress Integration**: Seamless web interface through Home Assistant UI
- **Multi-LLM Support**: OpenAI (GPT-4, o1-mini), Claude, Groq, and Ollama providers
- **Real-time Analysis**: Live progress tracking with automatic UI updates
- **Three-Stage Workflow**: Suggest → Accept → Apply with user control
- **Automatic Backups**: Safe configuration modification with rollback support
- **Professional UI**: LitElement TypeScript SPA with HA theming
- **Dual Analysis Types**: 
  - Configuration optimization suggestions
  - Automation suggestions based on available entities
- **Safety Features**:
  - YAML syntax validation before applying changes
  - File modification detection with SHA-256 hashing
  - Comprehensive error handling and recovery
- **Home Assistant API Integration**: 
  - Access to HA Core API via SUPERVISOR_TOKEN
  - Entity registry integration for automation suggestions
  - Configuration validation through HA services
- **Real-time Monitoring**:
  - Live scan progress with visual indicators
  - Automatic UI refresh when operations complete
  - Comprehensive logging with real-time updates
- **Advanced Diff Management**:
  - Side-by-side and unified diff viewers
  - Syntax highlighting for YAML changes
  - Clear before/after comparisons
- **Addon Documentation**: Complete user guides and troubleshooting
- **Multi-Architecture Support**: ARM64, AMD64, ARMv7, ARMhf, i386
- **Security Features**:
  - AppArmor security profile
  - Encrypted API key storage
  - Limited file system access
  - Input validation and sanitization

### Technical Implementation
- **Backend**: FastAPI + SQLAlchemy + SQLite with full REST API
- **Frontend**: LitElement TypeScript components with Web Components
- **Database**: Complete schema with scan history and suggestion tracking
- **LLM Integration**: Pluggable provider architecture with streaming support
- **Container**: Home Assistant add-on compliant Docker configuration
- **Supervisor Integration**: S6 overlay with proper service management

### Development Features
- **Type Safety**: Full TypeScript frontend with proper interfaces
- **Testing**: Comprehensive test suite with real LLM provider testing
- **Build System**: Multi-architecture Docker builds with GitHub Actions
- **Development Tools**: VS Code devcontainer support for HA development
- **Documentation**: Complete developer guides and API documentation

### Tested Configurations
- ✅ OpenAI o1-mini model with real API integration
- ✅ Complex Home Assistant configurations (100+ entities)
- ✅ Multi-file YAML parsing with ruamel.yaml
- ✅ Real-time UI updates and progress tracking
- ✅ Safe configuration modification with automatic backups
- ✅ Home Assistant Ingress authentication and routing

[Unreleased]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/rickoslyder/ha-config-optimizer/releases/tag/v0.1.0