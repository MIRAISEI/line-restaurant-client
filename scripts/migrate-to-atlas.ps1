# MongoDB Atlas Migration Script (PowerShell)
# 
# This script helps migrate data from local MongoDB to MongoDB Atlas
# 
# Usage:
# 1. Set environment variables or update the connection strings below
# 2. Run: .\scripts\migrate-to-atlas.ps1

param(
    [string]$LocalDbUrl = "mongodb://localhost:27017/sukiyarestaurant",
    [string]$AtlasDbUrl = "",
    [string]$DbName = "sukiyarestaurant"
)

$Collections = @("users", "menu_items", "orders", "order_items")

if ([string]::IsNullOrEmpty($AtlasDbUrl)) {
    Write-Host "❌ Atlas connection string is required!" -ForegroundColor Red
    Write-Host "Usage: .\scripts\migrate-to-atlas.ps1 -AtlasDbUrl 'mongodb+srv://...'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting MongoDB Atlas Migration..." -ForegroundColor Green
Write-Host ""
Write-Host "Local DB: $LocalDbUrl"
Write-Host "Atlas DB: $($AtlasDbUrl.Split('@')[1])" -ForegroundColor Gray
Write-Host ""

# Check if mongodump and mongorestore are available
$mongodump = Get-Command mongodump -ErrorAction SilentlyContinue
$mongorestore = Get-Command mongorestore -ErrorAction SilentlyContinue

if (-not $mongodump -or -not $mongorestore) {
    Write-Host "❌ mongodump and mongorestore are required!" -ForegroundColor Red
    Write-Host "Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Yellow
    exit 1
}

# Create backup directory
$backupDir = "./mongodb-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "📦 Exporting data from local MongoDB..." -ForegroundColor Cyan
try {
    mongodump --uri="$LocalDbUrl" --out="$backupDir"
    if ($LASTEXITCODE -ne 0) {
        throw "mongodump failed"
    }
    Write-Host "✅ Export completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Export failed: $_" -ForegroundColor Red
    Remove-Item -Path $backupDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "📤 Importing data to MongoDB Atlas..." -ForegroundColor Cyan
try {
    $dbBackupPath = Join-Path $backupDir $DbName
    if (Test-Path $dbBackupPath) {
        mongorestore --uri="$AtlasDbUrl" --drop "$dbBackupPath"
        if ($LASTEXITCODE -ne 0) {
            throw "mongorestore failed"
        }
        Write-Host "✅ Import completed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backup directory not found, skipping import" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Import failed: $_" -ForegroundColor Red
    Write-Host "Backup saved at: $backupDir" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create .env.local file with the Atlas connection string:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   DATABASE_URL=$AtlasDbUrl" -ForegroundColor Gray
Write-Host "   JWT_SECRET=your-secret-key-change-in-production" -ForegroundColor Gray
Write-Host "   JWT_EXPIRES_IN=7d" -ForegroundColor Gray
Write-Host ""
Write-Host "   Or copy from env.template and update with your values" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test your application: npm run dev" -ForegroundColor Yellow
Write-Host "3. Update Vercel environment variables if deploying" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backup saved at: $backupDir" -ForegroundColor Gray

