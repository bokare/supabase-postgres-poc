# 🌡️ Temperature Monitoring System Setup

This document explains how to set up the temperature monitoring system for the Supabase To-Do List application.

## 📋 Overview

The temperature monitoring system automatically generates random temperature values (0-100°C) every minute when a simulation is running, logs them to the database, and sends email alerts for critical temperatures (≥90°C).

### ⏰ **How Temperature Generation Works**

- **GitHub Actions**: Runs every 1 minute (minimum interval)
- **Edge Function**: Generates 1 temperature reading per call
- **Result**: 1 temperature reading generated every minute
- **Database**: Each reading is logged with its own timestamp
- **Real-time**: All readings are broadcast to clients immediately

## 🏗️ Architecture

- **Database**: PostgreSQL with `checkup_events` table
- **Backend**: Supabase Edge Functions for temperature generation
- **Cron**: GitHub Actions for scheduled execution
- **Email**: Supabase built-in email service for alerts
- **Frontend**: Real-time dashboard with temperature charts

## 🚀 Setup Instructions

### Step 1: Deploy Edge Functions

#### Option A: Deploy via Supabase Dashboard (Recommended - No CLI needed)

1. **Go to your Supabase Dashboard**:

   - Navigate to **Edge Functions** in the left sidebar
   - Click **Create a new function**

2. **Deploy `generate-temperature` function**:

   - Click **Create a new function**
   - Function name: `generate-temperature`
   - Copy the entire contents of `supabase/functions/generate-temperature/index.ts`
   - Paste it into the code editor
   - Click **Deploy function**

3. **Deploy `send-critical-alert` function**:

   - Click **Create a new function**
   - Function name: `send-critical-alert`
   - Copy the entire contents of `supabase/functions/send-critical-alert/index.ts`
   - Paste it into the code editor
   - Click **Deploy function**

4. **Verify deployment**:
   - Both functions should appear in the Edge Functions list
   - Status should show as "Active"

#### Option B: Deploy via Supabase CLI (Alternative)

1. **Install Supabase CLI** (if not already installed):

   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:

   ```bash
   supabase login
   ```

3. **Link your project**:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy generate-temperature
   supabase functions deploy send-critical-alert
   ```

### Step 2: Configure GitHub Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

#### Quick Reference for Dashboard Deployment

**Function 1: `generate-temperature`**

- Copy from: `supabase/functions/generate-temperature/index.ts`
- Deploy to: Supabase Dashboard > Edge Functions > Create function

**Function 2: `send-critical-alert`**

- Copy from: `supabase/functions/send-critical-alert/index.ts`
- Deploy to: Supabase Dashboard > Edge Functions > Create function

### Step 3: Enable GitHub Actions

1. Go to **Actions** tab in your GitHub repository
2. Enable GitHub Actions if not already enabled
3. The workflow will run automatically every minute

### Step 4: Configure Email Service (Optional)

For email alerts to work, you need to configure Supabase's email service:

1. Go to your Supabase dashboard
2. Navigate to **Settings > Auth > SMTP Settings**
3. Configure your email provider (SendGrid, Mailgun, etc.)
4. Or use the fallback logging system (emails will be logged to console)

## 🔧 Testing

### Test Database Functions

Run in Supabase SQL Editor:

```sql
-- Test getting active simulation ID
SELECT get_active_simulation_id();

-- Test inserting a checkup event
SELECT insert_checkup_event(75, 'test-simulation-id');

-- Test critical temperature
SELECT insert_checkup_event(95, 'test-simulation-id');
```

### Test Edge Functions

```bash
# Test temperature generation
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-temperature"

# Test critical alert
curl -X POST \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 95, "simulation_id": "test", "timestamp": "2024-01-01T00:00:00Z"}' \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-critical-alert"
```

### Test GitHub Actions

1. Go to **Actions** tab in GitHub
2. Click on **Temperature Monitoring System**
3. Click **Run workflow** to manually trigger

## 📊 Monitoring

### Check Temperature Data

```sql
-- View recent temperature readings
SELECT * FROM checkup_events
ORDER BY timestamp DESC
LIMIT 20;

-- View critical temperatures only
SELECT * FROM checkup_events
WHERE status = 'critical'
ORDER BY timestamp DESC;

-- View temperature statistics
SELECT
  status,
  COUNT(*) as count,
  AVG(temperature) as avg_temp,
  MIN(temperature) as min_temp,
  MAX(temperature) as max_temp
FROM checkup_events
GROUP BY status;
```

### Check GitHub Actions Logs

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. View logs for temperature generation calls

## 🚨 Troubleshooting

### Common Issues

1. **Edge Functions not deploying**:

   - Check Supabase CLI is installed and logged in
   - Verify project reference is correct
   - Check function code for syntax errors

2. **GitHub Actions failing**:

   - Verify secrets are set correctly
   - Check Edge Function URLs are accessible
   - Review workflow logs for specific errors

3. **No temperature data**:

   - Ensure simulation is running (check `simulation_events` table)
   - Verify GitHub Actions are running
   - Check Edge Function logs in Supabase dashboard

4. **Email alerts not working**:
   - Check SMTP configuration in Supabase
   - Verify email function is deployed
   - Check function logs for email errors

### Debug Commands

```bash
# Check Supabase project status
supabase status

# View function logs
supabase functions logs generate-temperature
supabase functions logs send-critical-alert

# Test local development
supabase start
supabase functions serve
```

## 📈 Performance

- **Database**: Optimized with indexes on timestamp, status, and temperature
- **Cron**: Runs every minute (GitHub Actions limitation)
- **Real-time**: Uses Supabase Real-time for instant updates
- **Email**: Asynchronous to avoid blocking temperature generation

## 🔒 Security

- **RLS**: Row Level Security enabled on all tables
- **Functions**: SECURITY DEFINER for controlled access
- **API Keys**: Stored as GitHub secrets
- **Validation**: Input validation on all functions

## 📝 Next Steps

After setup, the system will:

1. ✅ Generate temperatures every 5 seconds when simulation is running
2. ✅ Log all temperature data to `checkup_events` table
3. ✅ Send email alerts for critical temperatures (≥90°C)
4. ✅ Provide real-time updates to all connected clients
5. ✅ Display temperature charts in the dashboard

The temperature monitoring system is now ready to use! 🌡️
