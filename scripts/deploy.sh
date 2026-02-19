#!/bin/bash

# ============================================================================
# Frontend Deployment Script to GCS (GSAT English Practice)
# ============================================================================
# Builds and deploys the GSAT English frontend to Google Cloud Storage
# with automatic cache-busting via Vite's asset hashing.
#
# Usage:
#   ./scripts/deploy.sh
#
# Environment Variables (optional):
#   GCS_BUCKET: GCS bucket name (default: jutor-event-di1dzdgl64)
#   GCS_PATH: Path within bucket (default: event/past-exam/gsat-english)
#   COMPANY_ACCOUNT: Google account for authentication
# ============================================================================

set -e

# Configuration
GCS_BUCKET="${GCS_BUCKET:-jutor-event-di1dzdgl64}"
GCS_PATH="${GCS_PATH:-event/past-exam/gsat-english}"
COMPANY_ACCOUNT="${COMPANY_ACCOUNT:-ys.fang@junyiacademy.org}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== GSAT English Frontend Deployment to GCS ===${NC}"
echo "Bucket: ${GCS_BUCKET}"
echo "Path: ${GCS_PATH}"
echo "Final URL: https://www.jutor.ai/${GCS_PATH}/"
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/web"

# Validate project structure
echo -e "${YELLOW}Validating project structure...${NC}"
if [ ! -d "$WEB_DIR" ]; then
    echo -e "${RED}Error: web directory not found at $WEB_DIR!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project structure validated${NC}"
echo ""

# Google Cloud authentication
echo -e "${YELLOW}Checking Google Cloud authentication...${NC}"
CURRENT_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
echo "Current account: ${CURRENT_ACCOUNT:-not set}"

if [ -z "$CI" ]; then
    if [ "$CURRENT_ACCOUNT" != "$COMPANY_ACCOUNT" ]; then
        echo -e "${YELLOW}Switching to company account: ${COMPANY_ACCOUNT}${NC}"
        echo "A browser window will open for authentication..."
        gcloud auth login --account="$COMPANY_ACCOUNT" 2>/dev/null || gcloud auth login
        echo -e "${GREEN}✓ Switched to company account${NC}"
    else
        echo -e "${GREEN}✓ Already using company account${NC}"
    fi
else
    echo -e "${GREEN}✓ Running in CI - using pre-configured auth${NC}"
fi
echo ""

# Build the frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd "$WEB_DIR"
pnpm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"
echo ""

# Verify dist directory
DIST_DIR="$WEB_DIR/dist"
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}Error: dist directory not found at $DIST_DIR!${NC}"
    exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
    echo -e "${RED}Error: index.html not found in dist!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build output verified${NC}"
echo ""

# Clean old files from GCS
echo -e "${YELLOW}Cleaning old files from gs://${GCS_BUCKET}/${GCS_PATH}/...${NC}"
gsutil -m rm -r "gs://${GCS_BUCKET}/${GCS_PATH}/**" 2>/dev/null || echo "  (no old files to clean)"
echo -e "${GREEN}✓ Old files cleaned${NC}"
echo ""

# Upload files to GCS
echo -e "${YELLOW}Uploading files to GCS...${NC}"
cd "$DIST_DIR"

# 1. Upload index.html with no-cache header
echo -e "${BLUE}  Uploading index.html (no-cache)...${NC}"
gsutil -h "Content-Type:text/html" \
       -h "Cache-Control:no-cache, max-age=0" \
       cp index.html "gs://${GCS_BUCKET}/${GCS_PATH}/index.html"

# 2. Upload hashed assets with long-term cache (1 year immutable)
echo -e "${BLUE}  Uploading assets (long-term cache)...${NC}"
if [ -d "assets" ]; then
    gsutil -m -h "Cache-Control:public, max-age=31536000, immutable" \
           rsync -r assets "gs://${GCS_BUCKET}/${GCS_PATH}/assets"
fi

# 3. Upload images directory (if present in dist)
if [ -d "images" ]; then
    echo -e "${BLUE}  Uploading images...${NC}"
    gsutil -m -h "Cache-Control:public, max-age=86400" \
           rsync -r images "gs://${GCS_BUCKET}/${GCS_PATH}/images"
fi

echo -e "${GREEN}✓ All files uploaded successfully${NC}"
echo ""

# Verify upload
echo -e "${YELLOW}Verifying uploaded files...${NC}"
gsutil ls -lh "gs://${GCS_BUCKET}/${GCS_PATH}/" | head -20
echo ""

# Display access URLs
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Direct GCS URL:"
echo "   https://storage.googleapis.com/${GCS_BUCKET}/${GCS_PATH}/index.html"
echo ""
echo "Production URL (via Cloudflare):"
echo "   https://www.jutor.ai/${GCS_PATH}/"
echo ""
