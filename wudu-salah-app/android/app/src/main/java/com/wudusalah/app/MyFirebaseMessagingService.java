package com.wudusalah.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String SIREN_CHANNEL_ID = "fcm_siren_channel";
    private static final String CUSTOM_AUDIO_CHANNEL_ID = "fcm_custom_audio_channel";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        String title = "";
        String body = "";
        String imageUrl = "";
        String audioUrl = "";

        // Handle data messages (from admin panel - works in background too)
        if (remoteMessage.getData().size() > 0) {
            title = remoteMessage.getData().get("title");
            body = remoteMessage.getData().get("body");
            String img = remoteMessage.getData().get("image");
            if (img != null) imageUrl = img;
            String aud = remoteMessage.getData().get("audio");
            if (aud != null) audioUrl = aud;
        }

        // Handle notification messages (from Firebase Console - foreground only)
        if (remoteMessage.getNotification() != null) {
            if (title == null || title.isEmpty()) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (body == null || body.isEmpty()) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        // Launch full-screen alert activity
        Intent alertIntent = new Intent(this, AlertActivity.class);
        alertIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        alertIntent.putExtra("title", title != null ? title : "");
        alertIntent.putExtra("body", body != null ? body : "");
        alertIntent.putExtra("image", imageUrl);
        alertIntent.putExtra("audio", audioUrl);

        PendingIntent fullScreenIntent = PendingIntent.getActivity(
            this, 0, alertIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Use silent channel for custom audio (AlertActivity plays it)
        // Use siren channel for default (siren plays from notification)
        boolean hasCustomAudio = audioUrl != null && !audioUrl.isEmpty();
        String channelId = hasCustomAudio ? CUSTOM_AUDIO_CHANNEL_ID : SIREN_CHANNEL_ID;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000})
            .setAutoCancel(true)
            .setFullScreenIntent(fullScreenIntent, true);


        // Add big picture if image URL is available
        if (imageUrl != null && !imageUrl.isEmpty()) {
            try {
                URL url = new URL(imageUrl);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();
                Bitmap bitmap = BitmapFactory.decodeStream(input);
                if (bitmap != null) {
                    builder.setStyle(new NotificationCompat.BigPictureStyle()
                        .bigPicture(bitmap)
                        .bigLargeIcon((Bitmap) null));
                    builder.setLargeIcon(bitmap);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(9999, builder.build());
        }

        // Force launch alert activity directly (wake screen + overlay)
        try {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            PowerManager.WakeLock wl = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "wudusalah:fcm_wake"
            );
            wl.acquire(10 * 1000L); // 10 seconds

            // Start activity directly - works with SYSTEM_ALERT_WINDOW permission
            startActivity(alertIntent);
            Log.d("FCMService", "Alert activity started directly");
        } catch (Exception e) {
            Log.e("FCMService", "Failed to start alert activity directly", e);
        }
    }
}
