# Telegram Notification System

Sends real-time notifications from AI coding agents to your Telegram.

---

## 📦 Files

```
vibecoding/
├── notify.php       # Main handler
├── config.php       # Configuration (YOU EDIT THIS)
├── logs/            # Auto-created
│   ├── notifications.log
│   └── error.log
└── README.md        # This file
```

---

## 🚀 Setup (5 minutes)

### Step 1: Get Telegram Bot Token

1. Open Telegram
2. Search for `@BotFather`
3. Send: `/newbot`
4. Follow instructions:
   - Choose bot name (e.g., "My Vibe Coding Bot")
   - Choose username (e.g., "my_vibecoding_bot")
5. **Copy the token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID

1. Search for `@userinfobot` on Telegram
2. Send: `/start`
3. Bot replies with your ID (e.g., `987654321`)
4. **Copy this number**

### Step 3: Upload Files to Server

Upload these files to your cPanel:

```
public_html/
└── vibecoding/
    ├── notify.php
    ├── config.php
    └── README.md
```

**Path**: `public_html/vibecoding/`

### Step 4: Edit config.php

1. In cPanel File Manager, open `vibecoding/config.php`
2. Replace:
   ```php
   $TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
   $TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE';
   ```
   
   With your actual values:
   ```php
   $TELEGRAM_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
   $TELEGRAM_CHAT_ID = '987654321';
   ```

3. **Save** the file

### Step 5: Set Permissions

In cPanel File Manager:
1. Select `vibecoding` folder
2. Click "Permissions"
3. Set to `755`
4. Do the same for `notify.php` and `config.php`

### Step 6: Test

Open in browser:
```
https://drconnectme.ir/vibecoding/notify.php?setup=true
```

You should see:
```json
{
  "success": true,
  "message": "Setup successful! Check your Telegram.",
  "timestamp": "..."
}
```

**Check Telegram** - you should receive a test message! 🎉

---

## 🔧 Usage (For AI Agents)

AI agents will automatically send notifications by making POST requests:

### Example: Task Complete

```bash
curl -X POST https://drconnectme.ir/vibecoding/notify.php \
  -H "Content-Type: application/json" \
  -d '{
    "type": "task_complete",
    "data": {
      "task_id": "TASK-001",
      "title": "Setup Database",
      "model": "sonnet",
      "time": "25m"
    }
  }'
```

### Example: Error Occurred

```bash
curl -X POST https://drconnectme.ir/vibecoding/notify.php \
  -H "Content-Type: application/json" \
  -d '{
    "type": "error",
    "data": {
      "task_id": "TASK-015",
      "error": "Connection timeout"
    }
  }'
```

### Example: Project Complete

```bash
curl -X POST https://drconnectme.ir/vibecoding/notify.php \
  -H "Content-Type: application/json" \
  -d '{
    "type": "project_complete",
    "data": {
      "tasks_completed": 18,
      "total_time": "10h 30m",
      "total_cost": "26.50"
    }
  }'
```

### Supported Types

- `task_complete` - Task finished successfully
- `task_start` - Task began
- `error` - Error occurred
- `project_complete` - All tasks done
- `budget_warning` - Approaching budget limit
- `help_needed` - Agent needs your decision

---

## 📋 Integration with Claude/Codex

Add this to your agent's code:

### Python Example

```python
import requests
import json

def send_telegram_notification(type, data):
    url = "https://drconnectme.ir/vibecoding/notify.php"
    payload = {
        "type": type,
        "data": data
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            print("✅ Notification sent")
        else:
            print(f"⚠️ Notification failed: {response.text}")
    except Exception as e:
        print(f"⚠️ Notification error: {e}")

# Usage
send_telegram_notification("task_complete", {
    "task_id": "TASK-001",
    "title": "Database Setup",
    "model": "sonnet",
    "time": "25m"
})
```

### Node.js Example

```javascript
async function sendTelegramNotification(type, data) {
  const url = 'https://drconnectme.ir/vibecoding/notify.php';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    
    if (response.ok) {
      console.log('✅ Notification sent');
    } else {
      console.log('⚠️ Notification failed:', await response.text());
    }
  } catch (error) {
    console.log('⚠️ Notification error:', error);
  }
}

// Usage
await sendTelegramNotification('task_complete', {
  task_id: 'TASK-001',
  title: 'Database Setup',
  model: 'sonnet',
  time: '25m'
});
```

---

## 🐛 Troubleshooting

### "Bot token or chat ID not configured"
→ Edit `config.php` and add your token and chat ID

### "Configuration error"
→ Make sure you replaced `YOUR_BOT_TOKEN_HERE` and `YOUR_CHAT_ID_HERE`

### "cURL error"
→ Check your server allows outgoing HTTPS connections

### "Failed to fetch"
→ Check the URL is correct: `https://drconnectme.ir/vibecoding/notify.php`

### No message received
1. Check bot token is correct
2. Check chat ID is correct
3. Make sure you started the bot (send `/start` to your bot)

### Check Logs

View logs in cPanel File Manager:
- `vibecoding/logs/notifications.log` - All notifications
- `vibecoding/logs/error.log` - PHP errors

---

## 🔐 Security Notes

1. **Never commit config.php to Git** (contains sensitive tokens)
2. The `logs/` directory is created automatically with proper permissions
3. Only you can receive notifications (uses your chat ID)
4. Tokens are never logged

---

## 📞 Support

If setup fails:
1. Check logs in `vibecoding/logs/`
2. Test with: `https://drconnectme.ir/vibecoding/notify.php?setup=true`
3. Verify bot token and chat ID are correct
4. Ensure server allows outgoing HTTPS to api.telegram.org

---

## ✅ Quick Checklist

- [ ] Created bot with @BotFather
- [ ] Got bot token
- [ ] Got chat ID from @userinfobot
- [ ] Uploaded files to `public_html/vibecoding/`
- [ ] Edited `config.php` with real values
- [ ] Set permissions to 755
- [ ] Tested with `?setup=true`
- [ ] Received test message in Telegram

**If all checked, you're done!** 🎉

---

**Version**: 1.0  
**Last Updated**: 2024-12-29
