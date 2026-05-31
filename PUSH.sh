#!/bin/bash
# Run this on your local machine to push to GitHub and trigger Vercel deploy

# 1. Download/clone the project
# 2. Navigate to folder
cd monthly-meeting

# 3. Set remote (already set if you downloaded the zip)
git remote set-url origin https://github.com/simplihan/Inventory-Meeting.git

# 4. Push to GitHub (will trigger Vercel auto-deploy)
git push --force origin main

echo "Done! Vercel will auto-deploy in ~30 seconds."
echo "Check: https://vercel.com/safarinv/meeting-dashboard"
