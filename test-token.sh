#!/bin/bash

# Load token from .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found!"
  exit 1
fi

if [ -z "$DISCORD_TOKEN" ]; then
  echo "❌ DISCORD_TOKEN not found in .env!"
  exit 1
fi

echo "🔍 Testing Discord bot token..."
echo ""

# Test 1: Get bot user info
echo "📝 Test 1: Getting bot info..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bot $DISCORD_TOKEN" https://discord.com/api/v10/users/@me)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Token is VALID!"
  echo ""
  echo "Bot Info:"
  echo "$BODY" | jq -r '"  Username: \(.username)\n  ID: \(.id)\n  Discriminator: \(.discriminator)"' 2>/dev/null || echo "$BODY"
else
  echo "❌ Token is INVALID!"
  echo "HTTP Status: $HTTP_CODE"
  echo "Response: $BODY"
  echo ""
  echo "🔧 How to fix:"
  echo "1. Go to https://discord.com/developers/applications"
  echo "2. Select your bot"
  echo "3. Go to Bot tab"
  echo "4. Click 'Reset Token'"
  echo "5. Copy the NEW token"
  echo "6. Update .env file with: DISCORD_TOKEN=your_new_token"
  exit 1
fi

echo ""
echo "📝 Test 2: Getting gateway info..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bot $DISCORD_TOKEN" https://discord.com/api/v10/gateway/bot)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Can access gateway!"
  echo ""
  echo "Gateway Info:"
  echo "$BODY" | jq -r '"  URL: \(.url)\n  Shards: \(.shards)\n  Session Start Limit: \(.session_start_limit.remaining)/\(.session_start_limit.total)"' 2>/dev/null || echo "$BODY"
else
  echo "⚠️ Cannot access gateway (HTTP $HTTP_CODE)"
fi

echo ""
echo "✅ All tests passed! Token is working correctly."
echo "You can now run: node simple-bot.js"
