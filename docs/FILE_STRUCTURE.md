# Labyrinth of Tartarus - File Structure

## Overview
This document outlines the complete file organization for the Labyrinth of Tartarus project, including the new asset management structure for mobile controls, visual modifiers, and atmospheric audio.

## Directory Structure

```
labyrinth-ai-engine/
├── Dockerfile                    # Container build configuration
├── LICENSE                       # Project license
├── README.md                     # Main project documentation
├── requirements.txt              # Python dependencies
├── docs/                         # Documentation
│   ├── schemas/                  # Data schemas and specifications
│   │   ├── oracle-events.json    # WebSocket message schemas
│   │   └── telemetry-schema.json # Telemetry data formats
│   └── api/                      # API documentation
├── app/                          # FastAPI backend
│   ├── __init__.py
│   ├── config.py                 # Application configuration
│   ├── main.py                   # FastAPI app entry point
│   ├── db/                       # Database layer
│   │   ├── __init__.py
│   │   ├── database.py           # Database connection and models
│   │   └── migrations/           # Database migrations
│   ├── routes/                   # API route handlers
│   │   ├── __init__.py
│   │   ├── game.py               # Game state endpoints
│   │   ├── telemetry.py          # Telemetry logging
│   │   └── websocket.py          # WebSocket handlers (NEW)
│   └── services/                 # Business logic
│       ├── __init__.py
│       ├── cluster_service.py    # Player clustering
│       ├── features.py           # Feature extraction
│       ├── player_clustering.py  # Clustering algorithms
│       ├── recommender.py        # Content recommendation
│       ├── story_engine.py       # Narrative generation
│       ├── telemetry_logger.py   # Telemetry processing
│       ├── telemetry_service.py  # Telemetry aggregation
│       └── oracle_service.py     # Oracle AI logic (NEW)
├── static/                       # Frontend assets
│   ├── index.html                # Main HTML page
│   ├── game.js                   # Main game logic
│   ├── style.css                 # Game styling
│   ├── config/                   # Frontend configuration
│   │   ├── game-config.json      # Game settings
│   │   └── controls-config.json  # Input configuration
│   ├── websocket/                # WebSocket client code
│   │   ├── connection.js         # WebSocket connection management
│   │   ├── oracle-client.js      # Oracle communication
│   │   └── message-handlers.js   # Message processing
│   └── assets/                   # Game assets
│       ├── audio/                # Audio files
│       │   ├── ambient/          # Background music
│       │   │   ├── calm.mp3      # Calm exploration music
│       │   │   ├── omen.mp3      # Tension building
│       │   │   ├── panic.mp3     # High danger music
│       │   │   └── triumph.mp3   # Victory themes
│       │   ├── sfx/              # Sound effects
│       │   │   ├── footsteps.mp3
│       │   │   ├── monster.mp3
│       │   │   └── interact.mp3
│       │   └── voice/            # Oracle voice lines
│       │       ├── welcome.mp3
│       │       ├── warning.mp3
│       │       └── farewell.mp3
│       ├── images/               # Image assets
│       │   ├── sprites/          # Game sprites
│       │   │   ├── monster.png
│       │   │   └── goal.png
│       │   ├── ui/               # UI elements
│       │   │   ├── joystick.png
│       │   │   ├── buttons.png
│       │   │   └── hud.png
│       │   └── effects/          # Visual effects
│       │       ├── shadows.png
│       │       ├── embers.png
│       │       └── fog.png
│       └── models/               # 3D models (future)
│           └── environment/
├── tests/                        # Test suite
│   ├── __init__.py
│   ├── test_game.py              # Game logic tests
│   ├── test_oracle.py            # Oracle AI tests
│   ├── test_websocket.py         # WebSocket tests
│   └── test_mobile.py            # Mobile-specific tests
└── scripts/                      # Utility scripts
    ├── build-assets.py           # Asset processing
    ├── generate-audio.py         # Procedural audio generation
    └── performance-test.py       # Performance benchmarking
```

## Asset Organization Guidelines

### Audio Assets (`static/assets/audio/`)
- **Format**: MP3 for compatibility, OGG for smaller size
- **Naming**: Descriptive names with mood/intensity indicators
- **Structure**: Organized by type (ambient, sfx, voice) then by context
- **Licensing**: All assets must be CC0/Public Domain to avoid copyright issues

### Image Assets (`static/assets/images/`)
- **Format**: PNG for sprites, JPG for backgrounds
- **Optimization**: Use appropriate compression levels
- **Naming**: Consistent naming convention (snake_case)
- **Resolution**: Mobile-first approach (high DPI support)

### Configuration Files (`static/config/`)
- **Format**: JSON for easy parsing
- **Validation**: Schema validation recommended
- **Environment**: Separate configs for development/production

## File Size Guidelines

### Mobile Performance Targets
- **Initial Load**: < 2MB total
- **Audio**: < 500KB per track
- **Images**: < 100KB per sprite sheet
- **JavaScript**: < 200KB minified + gzipped

### Loading Strategy
- **Critical Assets**: Load immediately (core game files)
- **Progressive Loading**: Load ambient audio after game start
- **Lazy Loading**: Load victory/defeat assets on demand

## Build Process

### Asset Pipeline
1. **Source Assets**: High-quality originals in `assets/source/`
2. **Processing**: Compression, optimization, format conversion
3. **Output**: Optimized assets in `static/assets/`
4. **Manifest**: Asset manifest for cache management

### Development vs Production
- **Development**: Uncompressed assets, source maps
- **Production**: Minified, compressed, cache-busted filenames