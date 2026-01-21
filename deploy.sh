#!/bin/bash

# 1. Add all changes
git add .

# 2. Commit with a timestamp
# You can change the message if you want, but this is automatic
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"

# 3. Push to GitHub
git push origin main

echo "---------------------------------------"
echo "✅ Code pushed to GitHub successfully!"
echo "🚀 Build should start automatically."
echo "---------------------------------------"
