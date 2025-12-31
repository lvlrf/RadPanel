<?php
/**
 * Telegram Notification Handler
 * Version: 1.0
 * Date: 2024-12-29
 * 
 * This file handles notifications from AI coding agents to Telegram.
 * Place this in: drconnectme.ir/vibecoding/
 */

// Load configuration
require_once 'config.php';

// Set content type
header('Content-Type: application/json; charset=utf-8');

// Enable error logging
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

/**
 * Send message to Telegram
 */
function sendTelegramMessage($message, $parseMode = 'Markdown') {
    global $TELEGRAM_BOT_TOKEN, $TELEGRAM_CHAT_ID;
    
    if (empty($TELEGRAM_BOT_TOKEN) || empty($TELEGRAM_CHAT_ID)) {
        return [
            'success' => false,
            'error' => 'Bot token or chat ID not configured'
        ];
    }
    
    $url = "https://api.telegram.org/bot{$TELEGRAM_BOT_TOKEN}/sendMessage";
    
    $data = [
        'chat_id' => $TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => $parseMode,
        'disable_web_page_preview' => true
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logNotification('ERROR', 'cURL error: ' . $error);
        return [
            'success' => false,
            'error' => $error
        ];
    }
    
    $result = json_decode($response, true);
    
    if ($httpCode === 200 && $result['ok']) {
        logNotification('SUCCESS', substr($message, 0, 100));
        return [
            'success' => true,
            'message_id' => $result['result']['message_id']
        ];
    } else {
        $errorMsg = $result['description'] ?? 'Unknown error';
        logNotification('ERROR', $errorMsg);
        return [
            'success' => false,
            'error' => $errorMsg
        ];
    }
}

/**
 * Log notification
 */
function logNotification($type, $message) {
    $logFile = __DIR__ . '/logs/notifications.log';
    $logDir = dirname($logFile);
    
    if (!file_exists($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] {$type}: {$message}\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Format notification message
 */
function formatMessage($type, $data) {
    $emoji = [
        'task_complete' => '✅',
        'task_start' => '🔄',
        'error' => '⚠️',
        'project_complete' => '🎉',
        'budget_warning' => '💰',
        'help_needed' => '🆘'
    ];
    
    $icon = $emoji[$type] ?? '📋';
    
    switch ($type) {
        case 'task_complete':
            return "{$icon} *Task Complete*\n\n"
                . "Task: `{$data['task_id']}`\n"
                . "Title: {$data['title']}\n"
                . "Model: {$data['model']}\n"
                . "Time: {$data['time']}\n"
                . "Status: Completed ✅";
                
        case 'task_start':
            return "{$icon} *Task Started*\n\n"
                . "Task: `{$data['task_id']}`\n"
                . "Title: {$data['title']}\n"
                . "Model: {$data['model']}\n"
                . "Estimated: {$data['estimated_time']}";
                
        case 'error':
            return "{$icon} *Error Occurred*\n\n"
                . "Task: `{$data['task_id']}`\n"
                . "Error: {$data['error']}\n"
                . "Logged in: PRD_NOTES.md\n\n"
                . "Action needed: Please check logs";
                
        case 'project_complete':
            return "{$icon} *Project Complete!*\n\n"
                . "✅ {$data['tasks_completed']} tasks completed\n"
                . "⏱️ Time: {$data['total_time']}\n"
                . "💰 Cost: \${$data['total_cost']}\n\n"
                . "Test checklist ready!";
                
        case 'budget_warning':
            return "{$icon} *Budget Warning*\n\n"
                . "Spent: \${$data['spent']} of \${$data['budget']}\n"
                . "Remaining: \${$data['remaining']}\n"
                . "Tasks left: {$data['tasks_remaining']}\n\n"
                . "Approaching budget limit";
                
        case 'help_needed':
            return "{$icon} *Need Help*\n\n"
                . "Task: `{$data['task_id']}`\n"
                . "Issue: {$data['issue']}\n\n"
                . "Waiting for your decision";
                
        default:
            return "{$icon} *Notification*\n\n" . json_encode($data, JSON_PRETTY_PRINT);
    }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Handle setup request
    if (isset($_GET['setup']) && $_GET['setup'] === 'true') {
        // Test configuration
        $testMessage = "🔧 *Setup Test*\n\nTelegram notification system is working!\n\nTimestamp: " . date('Y-m-d H:i:s');
        $result = sendTelegramMessage($testMessage);
        
        echo json_encode([
            'success' => $result['success'],
            'message' => $result['success'] 
                ? 'Setup successful! Check your Telegram.'
                : 'Setup failed: ' . $result['error'],
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    // Show usage
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Use POST to send notifications.',
        'usage' => [
            'endpoint' => 'https://drconnectme.ir/vibecoding/notify.php',
            'method' => 'POST',
            'content_type' => 'application/json',
            'body' => [
                'type' => 'task_complete|task_start|error|project_complete|budget_warning|help_needed',
                'data' => 'object with relevant fields'
            ]
        ]
    ]);
    exit;
}

// Get POST data
$input = file_get_contents('php://input');
$request = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// Validate request
if (!isset($request['type'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required field: type'
    ]);
    exit;
}

if (!isset($request['data'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing required field: data'
    ]);
    exit;
}

// Format and send message
$message = formatMessage($request['type'], $request['data']);
$result = sendTelegramMessage($message);

// Return response
http_response_code($result['success'] ? 200 : 500);
echo json_encode($result);
