package com.wudusalah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createHighPriorityNotificationChannel();
        subscribeToAlerts();
    }

    private void subscribeToAlerts() {
        FirebaseMessaging.getInstance().subscribeToTopic("all");
    }

    private void createHighPriorityNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Default FCM channel with high priority
            NotificationChannel channel = new NotificationChannel(
                "fcm_default_channel",
                "\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0637\u0628\u064a\u0642",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u062a\u0637\u0628\u064a\u0642 \u062a\u0639\u0644\u0645 \u0627\u0644\u0648\u0636\u0648\u0621 \u0648\u0627\u0644\u0635\u0644\u0627\u0629");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 200, 500});
            channel.enableLights(true);
            channel.setShowBadge(true);

            // No sound on notification channel - AlertActivity handles audio playback
            // This prevents double audio (notification sound + AlertActivity sound)
            channel.setSound(null, null);

            manager.createNotificationChannel(channel);
        }
    }
}
