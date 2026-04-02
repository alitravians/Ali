package com.videosaver.app.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.IBinder
import android.provider.MediaStore
import androidx.core.app.NotificationCompat
import com.videosaver.app.MainActivity
import com.videosaver.app.R
import com.videosaver.app.VideoSaverApp
import com.videosaver.app.data.db.AppDatabase
import com.videosaver.app.data.model.DownloadItem
import com.videosaver.app.data.model.DownloadStatus
import com.videosaver.app.data.model.Platform
import com.videosaver.app.data.repository.DownloadRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class VideoDownloadService : Service() {

    private val job = SupervisorJob()
    private val scope = CoroutineScope(Dispatchers.IO + job)
    private lateinit var repository: DownloadRepository

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    companion object {
        const val EXTRA_DOWNLOAD_ID = "download_id"
        const val EXTRA_VIDEO_URL = "video_url"
        const val EXTRA_FILE_NAME = "file_name"
        const val EXTRA_PLATFORM = "platform"
        private var notificationId = 1000
    }

    override fun onCreate() {
        super.onCreate()
        try {
            val db = AppDatabase.getDatabase(applicationContext)
            repository = DownloadRepository(db.downloadDao())
        } catch (e: Exception) {
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val downloadId = intent?.getLongExtra(EXTRA_DOWNLOAD_ID, -1) ?: -1
        val videoUrl = intent?.getStringExtra(EXTRA_VIDEO_URL) ?: ""
        val fileName = intent?.getStringExtra(EXTRA_FILE_NAME) ?: ""
        val platform = intent?.getStringExtra(EXTRA_PLATFORM) ?: ""

        if (downloadId == -1L || videoUrl.isEmpty()) {
            stopSelf()
            return START_NOT_STICKY
        }

        val currentNotifId = ++notificationId

        try {
            startForeground(currentNotifId, createNotification("جاري التحميل...", 0))
        } catch (e: Exception) {
            stopSelf()
            return START_NOT_STICKY
        }

        scope.launch {
            try {
                if (!::repository.isInitialized) {
                    val db = AppDatabase.getDatabase(applicationContext)
                    repository = DownloadRepository(db.downloadDao())
                }

                repository.updateStatus(downloadId, DownloadStatus.DOWNLOADING, 0)

                val requestBuilder = Request.Builder()
                    .url(videoUrl)
                    .header("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36")

                // Add platform-specific headers
                val isCobaltStream = videoUrl.contains("stuff.solutions/api/stream")
                val isTikWmCdn = videoUrl.contains("tiktokcdn") && !isCobaltStream
                when (platform) {
                    Platform.INSTAGRAM -> {
                        requestBuilder.header("Referer", "https://www.instagram.com/")
                    }
                    Platform.TIKTOK -> {
                        if (isCobaltStream) {
                            // Cobalt stream proxy - minimal headers
                            requestBuilder.header("Accept", "*/*")
                        } else if (isTikWmCdn) {
                            // Direct TikTok CDN URLs from tikwm - no special headers needed
                            requestBuilder.header("Accept", "*/*")
                            requestBuilder.header("Accept-Encoding", "identity")
                        } else {
                            // Other TikTok URLs
                            requestBuilder.header("Referer", "https://www.tiktok.com/")
                            requestBuilder.header("Accept", "*/*")
                            requestBuilder.header("Accept-Encoding", "identity")
                        }
                    }
                    else -> {
                        requestBuilder.header("Accept", "*/*")
                    }
                }

                val request = requestBuilder.build()

                // Try download with retry (cobalt stream URLs can return 500)
                var response = try {
                    client.newCall(request).execute()
                } catch (e: Exception) {
                    repository.updateError(downloadId, "فشل الاتصال بالخادم: ${e.message}")
                    stopSelf()
                    return@launch
                }

                // Retry once if server error (500/502/503)
                if (response.code in 500..503) {
                    response.close()
                    try {
                        Thread.sleep(2000) // Wait 2 seconds before retry
                        response = client.newCall(request).execute()
                    } catch (e: Exception) {
                        repository.updateError(downloadId, "فشل الاتصال بالخادم: ${e.message}")
                        stopSelf()
                        return@launch
                    }
                }

                if (!response.isSuccessful && response.code != 206) {
                    repository.updateError(downloadId, "فشل التحميل: ${response.code}")
                    stopSelf()
                    return@launch
                }

                val body = response.body
                if (body == null) {
                    repository.updateError(downloadId, "لم يتم العثور على الملف")
                    stopSelf()
                    return@launch
                }

                val totalBytes = body.contentLength()

                repository.updateStatus(downloadId, DownloadStatus.SAVING, 50)

                // Save to Gallery
                val savedPath = try {
                    saveToGallery(fileName, body.byteStream(), totalBytes) { progress ->
                        scope.launch {
                            try {
                                repository.updateStatus(downloadId, DownloadStatus.DOWNLOADING, progress)
                                updateNotification(currentNotifId, "جاري التحميل... $progress%", progress)
                            } catch (_: Exception) {
                                // Ignore notification update failures
                            }
                        }
                    }
                } catch (e: Exception) {
                    repository.updateError(downloadId, "فشل في حفظ الملف: ${e.message}")
                    stopSelf()
                    return@launch
                }

                if (savedPath != null) {
                    repository.updateCompleted(downloadId, savedPath)
                    try {
                        showCompletionNotification(currentNotifId, fileName)
                    } catch (_: Exception) {
                        // Ignore notification failures
                    }
                } else {
                    repository.updateError(downloadId, "فشل في حفظ الملف في المعرض")
                }

            } catch (e: Exception) {
                try {
                    if (::repository.isInitialized) {
                        repository.updateError(downloadId, "خطأ: ${e.message}")
                    }
                } catch (_: Exception) {
                    // Cannot update error status
                }
            } finally {
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    private fun saveToGallery(
        fileName: String,
        inputStream: java.io.InputStream,
        totalBytes: Long,
        onProgress: (Int) -> Unit
    ): String? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveWithMediaStore(fileName, inputStream, totalBytes, onProgress)
        } else {
            saveWithLegacy(fileName, inputStream, totalBytes, onProgress)
        }
    }

    private fun saveWithMediaStore(
        fileName: String,
        inputStream: java.io.InputStream,
        totalBytes: Long,
        onProgress: (Int) -> Unit
    ): String? {
        val values = ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/${VideoSaverApp.FOLDER_NAME}")
            put(MediaStore.Video.Media.IS_PENDING, 1)
        }

        val uri = contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values)
            ?: return null

        return try {
            contentResolver.openOutputStream(uri)?.use { output ->
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalRead = 0L

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                    if (totalBytes > 0) {
                        val progress = ((totalRead * 100) / totalBytes).toInt().coerceIn(0, 100)
                        onProgress(progress)
                    }
                }
            }

            values.clear()
            values.put(MediaStore.Video.Media.IS_PENDING, 0)
            contentResolver.update(uri, values, null, null)

            uri.toString()
        } catch (e: Exception) {
            try {
                contentResolver.delete(uri, null, null)
            } catch (_: Exception) {
                // Ignore cleanup failure
            }
            null
        }
    }

    @Suppress("DEPRECATION")
    private fun saveWithLegacy(
        fileName: String,
        inputStream: java.io.InputStream,
        totalBytes: Long,
        onProgress: (Int) -> Unit
    ): String? {
        val dir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES),
            VideoSaverApp.FOLDER_NAME
        )
        if (!dir.exists()) dir.mkdirs()

        val file = File(dir, fileName)

        return try {
            FileOutputStream(file).use { output ->
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalRead = 0L

                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead
                    if (totalBytes > 0) {
                        val progress = ((totalRead * 100) / totalBytes).toInt().coerceIn(0, 100)
                        onProgress(progress)
                    }
                }
            }

            // Notify media scanner
            try {
                val intent = Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE)
                intent.data = Uri.fromFile(file)
                sendBroadcast(intent)
            } catch (_: Exception) {
                // Ignore scanner notification failure
            }

            file.absolutePath
        } catch (e: Exception) {
            null
        }
    }

    private fun createNotification(text: String, progress: Int): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, VideoSaverApp.CHANNEL_ID)
            .setContentTitle("Video Saver")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setProgress(100, progress, progress == 0)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(id: Int, text: String, progress: Int) {
        try {
            val notification = createNotification(text, progress)
            val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
            manager.notify(id, notification)
        } catch (_: Exception) {
            // Ignore notification update failures
        }
    }

    private fun showCompletionNotification(id: Int, fileName: String) {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, VideoSaverApp.CHANNEL_ID)
            .setContentTitle("تم التحميل بنجاح")
            .setContentText(fileName)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(id + 1000, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        job.cancel()
    }
}
