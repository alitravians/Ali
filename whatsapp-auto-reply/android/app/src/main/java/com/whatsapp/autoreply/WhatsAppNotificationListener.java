package com.whatsapp.autoreply;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import android.app.PendingIntent;

/**
 * NotificationListenerService for reading WhatsApp notifications
 * and automatically replying to incoming messages.
 * 
 * This service reads WhatsApp notifications, extracts the message content
 * and sender info, then uses the notification's reply action to send
 * auto-replies based on configured rules.
 */
public class WhatsAppNotificationListener extends NotificationListenerService {

    private static final String TAG = "WAAutoReply";
    private static final String WHATSAPP_PACKAGE = "com.whatsapp";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getPackageName() == null) return;
        
        // Only process WhatsApp notifications
        if (!sbn.getPackageName().equals(WHATSAPP_PACKAGE)) return;

        try {
            Notification notification = sbn.getNotification();
            if (notification == null || notification.extras == null) return;

            Bundle extras = notification.extras;
            
            // Extract message info
            String title = extras.getString(Notification.EXTRA_TITLE, "");
            CharSequence textCs = extras.getCharSequence(Notification.EXTRA_TEXT);
            String text = textCs != null ? textCs.toString() : "";
            
            if (title.isEmpty() || text.isEmpty()) return;
            
            // Skip group messages (they contain " - " in title or "messages" in text)
            if (text.contains("رسائل") || text.contains("messages")) return;
            
            Log.d(TAG, "WhatsApp message from: " + title + " -> " + text);
            
            // Send broadcast to the Capacitor plugin for processing
            Intent intent = new Intent("com.whatsapp.autoreply.NEW_MESSAGE");
            intent.putExtra("sender", title);
            intent.putExtra("message", text);
            intent.putExtra("notification_id", sbn.getId());
            intent.setPackage(getPackageName());
            sendBroadcast(intent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification: " + e.getMessage());
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Optional: handle notification removal
    }
    
    /**
     * Send a reply through WhatsApp notification reply action
     */
    public static void sendReply(Context context, StatusBarNotification sbn, String replyText) {
        if (sbn == null || sbn.getNotification() == null) return;
        
        try {
            Notification.Action[] actions = sbn.getNotification().actions;
            if (actions == null) return;
            
            for (Notification.Action action : actions) {
                if (action.getRemoteInputs() != null && action.getRemoteInputs().length > 0) {
                    android.app.RemoteInput[] remoteInputs = action.getRemoteInputs();
                    
                    Intent intent = new Intent();
                    Bundle bundle = new Bundle();
                    
                    for (android.app.RemoteInput remoteInput : remoteInputs) {
                        bundle.putCharSequence(remoteInput.getResultKey(), replyText);
                    }
                    
                    android.app.RemoteInput.addResultsToIntent(remoteInputs, intent, bundle);
                    
                    try {
                        action.actionIntent.send(context, 0, intent);
                        Log.d(TAG, "Reply sent successfully: " + replyText);
                    } catch (PendingIntent.CanceledException e) {
                        Log.e(TAG, "Failed to send reply: " + e.getMessage());
                    }
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error sending reply: " + e.getMessage());
        }
    }
}
