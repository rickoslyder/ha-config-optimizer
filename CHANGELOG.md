# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/rickoslyder/ha-config-optimizer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rickoslyder/ha-config-optimizer/releases/tag/v0.1.0