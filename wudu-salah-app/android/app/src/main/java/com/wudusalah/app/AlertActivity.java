package com.wudusalah.app;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AlertActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        );

        setContentView(R.layout.activity_alert);

        // Get notification data
        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");

        TextView alertTitle = findViewById(R.id.alertTitle);
        TextView alertBody = findViewById(R.id.alertBody);

        if (title != null && !title.isEmpty()) {
            alertTitle.setText(title);
        }
        if (body != null && !body.isEmpty()) {
            alertBody.setText(body);
        }

        // Load notification image if available
        String imageUrl = getIntent().getStringExtra("image");
        if (imageUrl != null && !imageUrl.isEmpty()) {
            ImageView alertImage = findViewById(R.id.alertImage);
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Handler handler = new Handler(Looper.getMainLooper());
            executor.execute(() -> {
                try {
                    URL url = new URL(imageUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(input);
                    handler.post(() -> {
                        alertImage.setImageBitmap(bitmap);
                        alertImage.setVisibility(View.VISIBLE);
                    });
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        // Play custom audio or default siren
        String audioUrl = getIntent().getStringExtra("audio");
        if (audioUrl != null && !audioUrl.isEmpty()) {
            // Play custom audio from URL
            try {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                mediaPlayer.setDataSource(audioUrl);
                mediaPlayer.setLooping(true);
                mediaPlayer.setOnPreparedListener(mp -> mp.start());
                mediaPlayer.prepareAsync();
            } catch (Exception e) {
                e.printStackTrace();
                // Fallback to default siren
                mediaPlayer = MediaPlayer.create(this, R.raw.siren);
                if (mediaPlayer != null) {
                    mediaPlayer.setLooping(true);
                    mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                    mediaPlayer.start();
                }
            }
        } else {
            // Default siren sound
            mediaPlayer = MediaPlayer.create(this, R.raw.siren);
            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true);
                mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                mediaPlayer.start();
            }
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

        // Dismiss button
        Button dismissButton = findViewById(R.id.dismissButton);
        dismissButton.setOnClickListener(v -> {
            stopAlarm();
            finish();
        });
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
    }
}
