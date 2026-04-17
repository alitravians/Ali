package com.wudusalah.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.util.Log;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.net.Uri;
import android.os.CountDownTimer;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AlertActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Wake up the screen
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(
            PowerManager.FULL_WAKE_LOCK |
            PowerManager.ACQUIRE_CAUSES_WAKEUP |
            PowerManager.ON_AFTER_RELEASE,
            "wudusalah:alert"
        );
        wakeLock.acquire(60 * 1000L); // 60 seconds max

        // Dismiss keyguard (unlock screen)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        }

        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );

        setContentView(R.layout.activity_alert);

        // Get notification data
        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");
        String notifType = getIntent().getStringExtra("notif_type");
        String sender = getIntent().getStringExtra("sender");
        String actionUrl = getIntent().getStringExtra("action_url");
        String autoDismissStr = getIntent().getStringExtra("auto_dismiss");

        TextView alertTitle = findViewById(R.id.alertTitle);
        TextView alertBody = findViewById(R.id.alertBody);
        RelativeLayout alertHeader = findViewById(R.id.alertHeader);
        TextView alertSender = findViewById(R.id.alertSender);
        Button openAppButton = findViewById(R.id.openAppButton);
        Button dismissButton = findViewById(R.id.dismissButton);

        if (title != null && !title.isEmpty()) {
            alertTitle.setText(title);
        }
        if (body != null && !body.isEmpty()) {
            alertBody.setText(body);
        }

        // Apply notification type colors
        if (notifType != null) {
            switch (notifType) {
                case "urgent":
                    alertHeader.setBackgroundResource(R.drawable.header_gradient_red);
                    openAppButton.setTextColor(0xFFE53935);
                    openAppButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFFFEBEE));
                    dismissButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFE53935));
                    break;
                case "reminder":
                    alertHeader.setBackgroundResource(R.drawable.header_gradient_blue);
                    openAppButton.setTextColor(0xFF1E88E5);
                    openAppButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFE3F2FD));
                    dismissButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF1E88E5));
                    break;
                case "good_news":
                    alertHeader.setBackgroundResource(R.drawable.header_gradient_gold);
                    openAppButton.setTextColor(0xFFF9A825);
                    openAppButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFFFF8E1));
                    dismissButton.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFFF9A825));
                    break;
                default: // "update" or any other - keep green default
                    break;
            }
        }

        // Show sender name if provided
        if (sender != null && !sender.isEmpty()) {
            alertSender.setText(sender);
            alertSender.setVisibility(View.VISIBLE);
        }

        // Setup action URL button
        if (actionUrl != null && !actionUrl.isEmpty()) {
            openAppButton.setText("اقرأ المزيد");
            final String url = actionUrl;
            openAppButton.setOnClickListener(v -> {
                stopAlarm();
                try {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(browserIntent);
                } catch (Exception e) {
                    Log.e("AlertActivity", "Failed to open URL", e);
                }
                finish();
            });
        }

        // Auto-dismiss countdown
        if (autoDismissStr != null && !autoDismissStr.isEmpty()) {
            try {
                int seconds = Integer.parseInt(autoDismissStr);
                if (seconds > 0 && seconds <= 120) {
                    TextView countdownText = findViewById(R.id.countdownText);
                    countdownText.setVisibility(View.VISIBLE);
                    new CountDownTimer(seconds * 1000L, 1000) {
                        public void onTick(long millisUntilFinished) {
                            int secs = (int) (millisUntilFinished / 1000);
                            countdownText.setText("يغلق تلقائياً بعد " + secs + " ثانية");
                        }
                        public void onFinish() {
                            stopAlarm();
                            finish();
                        }
                    }.start();
                }
            } catch (NumberFormatException e) {
                // ignore invalid number
            }
        }

        // Load notification image if available
        String imageUrl = getIntent().getStringExtra("image");
        Log.d("AlertActivity", "Image URL: " + imageUrl);
        if (imageUrl != null && !imageUrl.isEmpty()) {
            ImageView alertImage = findViewById(R.id.alertImage);
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Handler handler = new Handler(Looper.getMainLooper());
            executor.execute(() -> {
                try {
                    URL url = new URL(imageUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.setConnectTimeout(10000);
                    connection.setReadTimeout(10000);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(input);
                    Log.d("AlertActivity", "Image loaded: " + (bitmap != null));
                    handler.post(() -> {
                        if (bitmap != null) {
                            alertImage.setImageBitmap(bitmap);
                            alertImage.setVisibility(View.VISIBLE);
                        }
                    });
                } catch (Exception e) {
                    Log.e("AlertActivity", "Failed to load image", e);
                    e.printStackTrace();
                }
            });
        }

        // Play custom audio or default siren
        String audioUrl = getIntent().getStringExtra("audio");
        Log.d("AlertActivity", "Audio URL: " + audioUrl);
        if (audioUrl != null && !audioUrl.isEmpty()) {
            // Cancel notification to stop siren sound from notification channel
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(9999);

            // Play custom audio from URL
            try {
                mediaPlayer = new MediaPlayer();
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
                mediaPlayer.setAudioAttributes(attrs);
                mediaPlayer.setDataSource(audioUrl);
                mediaPlayer.setLooping(true);
                mediaPlayer.setOnPreparedListener(mp -> {
                    Log.d("AlertActivity", "Custom audio prepared, starting playback");
                    mp.start();
                });
                mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                    Log.e("AlertActivity", "MediaPlayer error: " + what + " extra: " + extra);
                    // Fallback to default siren on error
                    mp.release();
                    playSiren();
                    return true;
                });
                mediaPlayer.prepareAsync();
            } catch (Exception e) {
                Log.e("AlertActivity", "Failed to set custom audio", e);
                e.printStackTrace();
                // Fallback to default siren
                playSiren();
            }
        } else {
            // Default siren sound
            playSiren();
        }

        // Strong vibration pattern
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        if (vibrator != null) {
            long[] pattern = {0, 1000, 500, 1000, 500, 1000};
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }

        // Entrance animation - slide from top with bounce (ViewPropertyAnimator)
        LinearLayout alertCard = findViewById(R.id.alertCard);
        alertCard.setTranslationY(-1500f);
        alertCard.setAlpha(0f);
        alertCard.animate()
            .translationY(0f)
            .alpha(1f)
            .setDuration(900)
            .setStartDelay(150)
            .setInterpolator(new OvershootInterpolator(1.0f))
            .start();

        // Dismiss button
        dismissButton.setOnClickListener(v -> {
            stopAlarm();
            finish();
        });

        // Open App button (only set default handler if no action URL was set)
        if (actionUrl == null || actionUrl.isEmpty()) {
            openAppButton.setOnClickListener(v -> {
                stopAlarm();
                PackageManager pkgMgr = getPackageManager();
                Intent launchIntent = pkgMgr.getLaunchIntentForPackage(getPackageName());
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(launchIntent);
                }
                finish();
            });
        }
    }

    private void playSiren() {
        mediaPlayer = MediaPlayer.create(this, R.raw.siren);
        if (mediaPlayer != null) {
            mediaPlayer.setLooping(true);
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            mediaPlayer.setAudioAttributes(attrs);
            mediaPlayer.start();
        }
    }

    private void stopAlarm() {
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAlarm();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
