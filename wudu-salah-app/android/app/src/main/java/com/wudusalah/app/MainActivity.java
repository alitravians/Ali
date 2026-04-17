package com.wudusalah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createHighPriorityNotificationChannel();
        subscribeToAlerts();
        requestOverlayPermission();
    }

    private void requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        }
    }

    private void subscribeToAlerts() {
        FirebaseMessaging.getInstance().subscribeToTopic("all");
    }

    private void createHighPriorityNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Delete old channels
            manager.deleteNotificationChannel("fcm_default_channel");
            manager.deleteNotificationChannel("fcm_silent_channel");

            // Channel WITH siren sound (for notifications without custom audio)
            NotificationChannel sirenChannel = new NotificationChannel(
                "fcm_siren_channel",
                "\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0637\u0628\u064a\u0642",
                NotificationManager.IMPORTANCE_HIGH
            );
            sirenChannel.setDescription("\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0645\u0639 \u0635\u0648\u062a \u0627\u0644\u0635\u0641\u0627\u0631\u0629");
            sirenChannel.enableVibration(true);
            sirenChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            sirenChannel.enableLights(true);
            sirenChannel.setShowBadge(true);
            Uri sirenUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.siren);
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            sirenChannel.setSound(sirenUri, audioAttributes);
            manager.createNotificationChannel(sirenChannel);

            // Channel WITHOUT sound (for notifications with custom audio)
            NotificationChannel customChannel = new NotificationChannel(
                "fcm_custom_audio_channel",
                "\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0628\u0635\u0648\u062a \u0645\u062e\u0635\u0635",
                NotificationManager.IMPORTANCE_HIGH
            );
            customChannel.setDescription("\u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0645\u0639 \u0635\u0648\u062a \u0645\u062e\u0635\u0635");
            customChannel.enableVibration(true);
            customChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            customChannel.enableLights(true);
            customChannel.setShowBadge(true);
            customChannel.setSound(null, null);
            manager.createNotificationChannel(customChannel);
        }
    }
}
