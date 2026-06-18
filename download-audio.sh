# Audio Download and Integration Script

#!/bin/bash

# This script downloads CC0/Public Domain audio files for the Labyrinth game
# Run this script from the project root directory

echo "🎵 Downloading CC0 Audio Assets for Labyrinth of Tartarus"
echo "======================================================"

# Create audio directories
mkdir -p static/assets/audio/ambient
mkdir -p static/assets/audio/sfx
mkdir -p static/assets/audio/voice

echo "📁 Created audio directories"

# Download CC0 audio files from recommended sources
# Note: These are example URLs - you should verify they are still available and CC0 licensed

echo "⬇️  Downloading ambient tracks..."

# Calm drone - CC0 from Freesound
# Example: Dark ambient drone by user "klankbeeld"
curl -L "https://freesound.org/data/previews/123/123456_567890-lq.mp3" \
     -o "static/assets/audio/ambient/calm-drone.mp3" 2>/dev/null || \
     echo "⚠️  Failed to download calm-drone.mp3 - please download manually from Freesound.org"

# Tension build - CC0 from OpenGameArt
# Example: Tension ambient
curl -L "https://opengameart.org/sites/default/files/audio_preview/tension_ambient.mp3" \
     -o "static/assets/audio/ambient/tension-build.mp3" 2>/dev/null || \
     echo "⚠️  Failed to download tension-build.mp3 - please download manually from OpenGameArt.org"

# Danger pulse - CC0 from Zapsplat
# Example: Horror ambient
curl -L "https://www.zapsplat.com/wp-content/uploads/2015/10/horror_ambient.mp3" \
     -o "static/assets/audio/ambient/danger-pulse.mp3" 2>/dev/null || \
     echo "⚠️  Failed to download danger-pulse.mp3 - please download manually from Zapsplat.com"

# Victory chorus - CC0 from Freesound
# Example: Triumphant choir
curl -L "https://freesound.org/data/previews/456/456789_987654-lq.mp3" \
     -o "static/assets/audio/ambient/victory-chorus.mp3" 2>/dev/null || \
     echo "⚠️  Failed to download victory-chorus.mp3 - please download manually from Freesound.org"

echo "✅ Audio download script completed"
echo ""
echo "🎯 Manual Download Instructions:"
echo "================================"
echo ""
echo "If automatic downloads failed, please download manually from:"
echo ""
echo "1. Freesound.org (search for 'dark ambient', 'horror ambient')"
echo "   - Look for CC0 licensed tracks"
echo "   - Download as MP3, rename to match config"
echo ""
echo "2. OpenGameArt.org (Audio section)"
echo "   - Search for 'ambient', 'atmospheric'"
echo "   - Verify CC0/Public Domain license"
echo ""
echo "3. Zapsplat.com (Free section)"
echo "   - Horror and atmospheric categories"
echo "   - Check for CC0 or free commercial use"
echo ""
echo "📁 Place files in: static/assets/audio/ambient/"
echo "🔧 Update config in: static/config/audio-config.json"
echo ""
echo "🎵 Test with: Open game and check browser console for audio status"