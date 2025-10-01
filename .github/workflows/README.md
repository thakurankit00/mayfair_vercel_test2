# GitHub Workflows Usage Guide

This directory contains automated workflows for deployment and database management. This guide will help developers understand and use these workflows effectively.

## 📋 Available Workflows

### 1. 🚀 Deploy to DEV & PROD
**File:** `deploy-dev-prod.yml`  
**Purpose:** Deploy any branch to development and/or production environments

#### When to Use:
- Deploy feature branches to dev for testing
- Deploy stable branches to production
- Deploy hotfixes to both environments simultaneously

#### How to Run:
1. Go to **Actions** → **Deploy to DEV & PROD**
2. Click **Run workflow**
3. Configure options:
   - **Branch to deploy:** Enter the branch name (e.g., `feature/new-feature`, `master`)
   - **Deploy dev:** Check to deploy to dev.mayfairmandi.com
   - **Deploy prod:** Check to deploy to prod.mayfairmandi.com
4. Click **Run workflow**

#### Output:
- **Dev URL:** https://dev.mayfairmandi.com
- **Prod URL:** https://prod.mayfairmandi.com
- **Deployment summaries** with commit info, URLs, and timestamps

---

### 2. 🔄 Sync Aiven DB with Supabase
**File:** `sync-aiven-db-with-supabase.yml`  
**Purpose:** Safely sync data from Supabase (source) to Aiven (destination) database

#### When to Use:
- Sync production data from Supabase to Aiven
- Update Aiven with latest Supabase changes
- Migrate data between environments

#### How to Run:
1. Go to **Actions** → **Sync Aiven DB with Supabase**
2. Click **Run workflow**
3. **IMPORTANT:** Type `CONFIRM` in the confirmation field
4. Click **Run workflow**

#### Backup Artifacts:
- **Name:** `database-backups-{run-number}`
- **Contains:** Supabase backup + Aiven backup (pre-sync)
- **Retention:** 7 days
- **Download:** Actions → Workflow run → Artifacts section

---

## 🚨 Important Safety Guidelines

### Deployment Workflow:
- ✅ **Test in dev first** before deploying to production
- ✅ **Check the branch name** carefully before running
- ✅ **Monitor deployment logs** for any issues
- ✅ **Verify URLs** work after deployment

### Database Sync Workflow:
- ⚠️ **ALWAYS type "CONFIRM"** - this prevents accidental runs
- ⚠️ **Understand the direction** - Supabase → Aiven (one way)
- ⚠️ **Download backups** if you need to restore later
- ⚠️ **Check both databases** are healthy before running

---

## 📊 Understanding Workflow Results

### Deployment Results:
Each environment gets its own summary box showing:
- **Target Branch:** Which branch was deployed
- **Environment URLs:** Both custom domain and Vercel URL
- **Deployment Details:** Commit, user, timestamp
- **Status:** Success/failure indicators

### Database Sync Results:
The summary includes:
- **Safety Measures:** All protections that were applied
- **Sync Details:** Source, destination, operation type
- **Execution Details:** Who ran it, when, status
- **Data Integrity:** What was preserved/changed
- **Backup Artifacts:** How to download backups

---

## 🔍 Troubleshooting

### Deployment Issues:
- **Build failures:** Check your code for syntax errors
- **Environment variables:** Ensure all required vars are set
- **Vercel limits:** Check if you've hit deployment limits
- **Branch not found:** Verify the branch name exists

### Database Sync Issues:
- **Connection failures:** Check database credentials and network
- **Version mismatch:** Workflow uses PostgreSQL 17 client
- **Permission errors:** Ensure database users have required permissions
- **Backup failures:** Check disk space and database accessibility

### Getting Help:
1. **Check workflow logs** in the Actions tab
2. **Look for error messages** in the failed steps
3. **Check database connectivity** manually if needed

*Last updated: $(date +'%Y-%m-%d')*  