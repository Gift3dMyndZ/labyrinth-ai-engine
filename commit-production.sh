#!/bin/bash

# Production Commit Script for Labyrinth AI Engine
# Commits all mobile touch controls, visual modifiers, and atmospheric audio features

echo "🎯 Preparing production commit for Labyrinth AI Engine"
echo "======================================================"

# Check git status
echo "📊 Checking git status..."
git status --porcelain

if [ $? -ne 0 ]; then
    echo "❌ Git repository not found or not initialized"
    exit 1
fi

echo ""
echo "📝 Staging all changes..."

# Add all new and modified files
git add .

echo "✅ Files staged successfully"
echo ""

# Create commit with detailed message
COMMIT_MESSAGE="🚀 Production Release: Mobile Touch Controls & Atmospheric Audio

✨ Features Added:
• Mobile touch controls with virtual joysticks
• Color bar visual modifier system
• Atmospheric audio with Oracle mood integration
• Sky shadows and infernal visual effects
• WebSocket Oracle communication system
• Mobile performance optimizations
• Comprehensive testing framework

🎵 Audio Integration:
• CC0/Public Domain audio sources
• Web Audio API with crossfading
• Oracle-responsive mood system
• Mobile audio unlock handling

📱 Mobile Features:
• Touch device detection and controls
• Performance monitoring (30+ FPS target)
• Battery-conscious optimizations
• Cross-platform compatibility

🔧 Technical Implementation:
• WebSocket backend for Oracle communication
• Audio manager with fade transitions
• Mobile testing framework
• Comprehensive documentation

🎯 Ready for Render deployment and real-device testing"

echo "💾 Creating commit..."
git commit -m "$COMMIT_MESSAGE"

if [ $? -eq 0 ]; then
    echo "✅ Commit created successfully!"
    echo ""
    echo "📋 Commit Details:"
    git log --oneline -1
    echo ""
    echo "🚀 Ready for deployment to Render!"
    echo "   • Mobile touch controls active"
    echo "   • Atmospheric audio integrated"
    echo "   • Oracle mood-responsive system"
    echo "   • Performance optimized for mobile"
else
    echo "❌ Commit failed. Please check git status and try again."
    exit 1
fi

echo ""
echo "🎉 Production commit complete!"
echo "   Run 'git push' to deploy to Render"