package com.ali.screenrecorder

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioPlaybackCaptureConfiguration
import android.media.AudioRecord
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.MediaStore
import android.util.DisplayMetrics
import android.util.Log
import android.view.Surface
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class ScreenRecorderService : Service() {

    companion object {
        const val TAG = "ScreenRecorderService"
        const val NOTIFICATION_CHANNEL_ID = "screen_recorder_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_PAUSE = "ACTION_PAUSE"
        const val ACTION_RESUME = "ACTION_RESUME"
        const val EXTRA_RESULT_CODE = "EXTRA_RESULT_CODE"
        const val EXTRA_RESULT_DATA = "EXTRA_RESULT_DATA"
        const val EXTRA_INCLUDE_MIC = "EXTRA_INCLUDE_MIC"

        private const val VIDEO_MIME_TYPE = "video/avc"
        private const val AUDIO_MIME_TYPE = "audio/mp4a-latm"
        private const val AUDIO_SAMPLE_RATE = 44100
        private const val AUDIO_CHANNEL_COUNT = 2
        private const val AUDIO_BIT_RATE = 128000
        private const val VIDEO_FRAME_RATE = 30
        private const val VIDEO_BIT_RATE = 6000000
        private const val I_FRAME_INTERVAL = 2

        var isRecording = false
            private set
        var isPaused = false
            private set
        var recordingStartTime: Long = 0
            private set
        var pausedDuration: Long = 0
            private set

        var onRecordingStateChanged: (() -> Unit)? = null
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaMuxer: MediaMuxer? = null

    private var videoEncoder: MediaCodec? = null
    private var audioEncoder: MediaCodec? = null
    private var audioRecord: AudioRecord? = null

    private var videoTrackIndex = -1
    private var audioTrackIndex = -1
    private var muxerStarted = false
    private val muxerLock = Object()
    private var tracksAdded = 0

    private var screenWidth = 1080
    private var screenHeight = 1920
    private var screenDensity = 1

    private var outputFile: File? = null
    private var inputSurface: Surface? = null

    private val isRunning = AtomicBoolean(false)
    private var audioThread: Thread? = null
    private var videoThread: Thread? = null

    private var pauseStartTime: Long = 0
    private var includeMic = false

    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                includeMic = intent.getBooleanExtra(EXTRA_INCLUDE_MIC, false)

                if (resultCode != Activity.RESULT_CANCELED && resultData != null) {
                    startForeground(NOTIFICATION_ID, createNotification("جاري التسجيل..."))
                    startRecording(resultCode, resultData)
                }
            }
            ACTION_STOP -> {
                stopRecording()
            }
            ACTION_PAUSE -> {
                pauseRecording()
            }
            ACTION_RESUME -> {
                resumeRecording()
            }
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "تسجيل الشاشة",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "إشعار تسجيل الشاشة"
            setShowBadge(false)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(text: String): Notification {
        val stopIntent = Intent(this, ScreenRecorderService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("مسجل الشاشة")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_record)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .addAction(R.drawable.ic_stop, "إيقاف", stopPendingIntent)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, createNotification(text))
    }

    private fun getScreenMetrics() {
        val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val metrics = DisplayMetrics()
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getRealMetrics(metrics)
        screenWidth = metrics.widthPixels
        screenHeight = metrics.heightPixels
        screenDensity = metrics.densityDpi
    }

    private fun startRecording(resultCode: Int, resultData: Intent) {
        try {
            getScreenMetrics()

            val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            mediaProjection = projectionManager.getMediaProjection(resultCode, resultData)

            if (mediaProjection == null) {
                Log.e(TAG, "MediaProjection is null")
                stopSelf()
                return
            }

            // Create output file in cache directory first
            val dateFormat = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.getDefault())
            val fileName = "تسجيل_${dateFormat.format(Date())}.mp4"
            outputFile = File(cacheDir, fileName)

            // Setup MediaMuxer
            mediaMuxer = MediaMuxer(
                outputFile!!.absolutePath,
                MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4
            )

            // Setup video encoder
            setupVideoEncoder()

            // Setup audio encoder and recorder
            setupAudioEncoder()
            setupAudioRecord()

            // Create virtual display
            virtualDisplay = mediaProjection!!.createVirtualDisplay(
                "ScreenRecorder",
                screenWidth, screenHeight, screenDensity,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                inputSurface, null, null
            )

            isRunning.set(true)
            isRecording = true
            isPaused = false
            recordingStartTime = System.currentTimeMillis()
            pausedDuration = 0

            // Start encoding threads
            startVideoEncoding()
            startAudioEncoding()

            // Start timer updates
            startTimerUpdates()

            // Update floating bubble state
            val updateBubble = Intent(this, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_UPDATE_STATE
            }
            startService(updateBubble)

            onRecordingStateChanged?.invoke()

            Log.i(TAG, "Recording started successfully")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start recording", e)
            cleanUp()
            stopSelf()
        }
    }

    private fun setupVideoEncoder() {
        val format = MediaFormat.createVideoFormat(VIDEO_MIME_TYPE, screenWidth, screenHeight).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            setInteger(MediaFormat.KEY_BIT_RATE, VIDEO_BIT_RATE)
            setInteger(MediaFormat.KEY_FRAME_RATE, VIDEO_FRAME_RATE)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
        }

        videoEncoder = MediaCodec.createEncoderByType(VIDEO_MIME_TYPE).apply {
            configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            inputSurface = createInputSurface()
            start()
        }
    }

    private fun setupAudioEncoder() {
        val format = MediaFormat.createAudioFormat(AUDIO_MIME_TYPE, AUDIO_SAMPLE_RATE, AUDIO_CHANNEL_COUNT).apply {
            setInteger(MediaFormat.KEY_AAC_PROFILE, MediaCodecInfo.CodecProfileLevel.AACObjectLC)
            setInteger(MediaFormat.KEY_BIT_RATE, AUDIO_BIT_RATE)
        }

        audioEncoder = MediaCodec.createEncoderByType(AUDIO_MIME_TYPE).apply {
            configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            start()
        }
    }

    private fun setupAudioRecord() {
        val projection = mediaProjection ?: return

        val playbackConfig = AudioPlaybackCaptureConfiguration.Builder(projection)
            .addMatchingUsage(AudioAttributes.USAGE_MEDIA)
            .addMatchingUsage(AudioAttributes.USAGE_GAME)
            .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .addMatchingUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION_SIGNALLING)
            .build()

        val audioFormat = AudioFormat.Builder()
            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
            .setSampleRate(AUDIO_SAMPLE_RATE)
            .setChannelMask(AudioFormat.CHANNEL_IN_STEREO)
            .build()

        val bufferSize = AudioRecord.getMinBufferSize(
            AUDIO_SAMPLE_RATE,
            AudioFormat.CHANNEL_IN_STEREO,
            AudioFormat.ENCODING_PCM_16BIT
        ) * 2

        audioRecord = AudioRecord.Builder()
            .setAudioPlaybackCaptureConfig(playbackConfig)
            .setAudioFormat(audioFormat)
            .setBufferSizeInBytes(bufferSize)
            .build()

        audioRecord?.startRecording()
    }

    private fun startVideoEncoding() {
        videoThread = Thread({
            val bufferInfo = MediaCodec.BufferInfo()
            try {
                while (isRunning.get()) {
                    val outputBufferIndex = videoEncoder?.dequeueOutputBuffer(bufferInfo, 10000) ?: break

                    when {
                        outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                            val newFormat = videoEncoder!!.outputFormat
                            synchronized(muxerLock) {
                                videoTrackIndex = mediaMuxer!!.addTrack(newFormat)
                                tracksAdded++
                                if (tracksAdded >= 2) {
                                    mediaMuxer!!.start()
                                    muxerStarted = true
                                }
                            }
                        }
                        outputBufferIndex >= 0 -> {
                            val outputBuffer = videoEncoder!!.getOutputBuffer(outputBufferIndex) ?: continue

                            if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0) {
                                bufferInfo.size = 0
                            }

                            if (bufferInfo.size > 0 && muxerStarted && !isPaused) {
                                outputBuffer.position(bufferInfo.offset)
                                outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                                synchronized(muxerLock) {
                                    if (muxerStarted) {
                                        mediaMuxer!!.writeSampleData(videoTrackIndex, outputBuffer, bufferInfo)
                                    }
                                }
                            }

                            videoEncoder!!.releaseOutputBuffer(outputBufferIndex, false)

                            if (bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) {
                                break
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Video encoding error", e)
            }
        }, "VideoEncoder")
        videoThread?.start()
    }

    private fun startAudioEncoding() {
        audioThread = Thread({
            val bufferInfo = MediaCodec.BufferInfo()
            val audioBuffer = ByteArray(4096)

            try {
                while (isRunning.get()) {
                    // Read audio data from AudioRecord
                    val readResult = audioRecord?.read(audioBuffer, 0, audioBuffer.size) ?: break

                    if (readResult > 0 && !isPaused) {
                        // Feed data to audio encoder
                        val inputBufferIndex = audioEncoder?.dequeueInputBuffer(10000) ?: continue
                        if (inputBufferIndex >= 0) {
                            val inputBuffer = audioEncoder!!.getInputBuffer(inputBufferIndex) ?: continue
                            inputBuffer.clear()
                            inputBuffer.put(audioBuffer, 0, readResult)
                            audioEncoder!!.queueInputBuffer(
                                inputBufferIndex, 0, readResult,
                                System.nanoTime() / 1000, 0
                            )
                        }
                    }

                    // Drain audio encoder output
                    var outputBufferIndex = audioEncoder?.dequeueOutputBuffer(bufferInfo, 0) ?: break
                    while (outputBufferIndex >= 0 || outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                        when {
                            outputBufferIndex == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                                val newFormat = audioEncoder!!.outputFormat
                                synchronized(muxerLock) {
                                    audioTrackIndex = mediaMuxer!!.addTrack(newFormat)
                                    tracksAdded++
                                    if (tracksAdded >= 2) {
                                        mediaMuxer!!.start()
                                        muxerStarted = true
                                    }
                                }
                            }
                            outputBufferIndex >= 0 -> {
                                val outputBuffer = audioEncoder!!.getOutputBuffer(outputBufferIndex)

                                if (outputBuffer != null && bufferInfo.size > 0 && muxerStarted) {
                                    outputBuffer.position(bufferInfo.offset)
                                    outputBuffer.limit(bufferInfo.offset + bufferInfo.size)
                                    synchronized(muxerLock) {
                                        if (muxerStarted) {
                                            mediaMuxer!!.writeSampleData(audioTrackIndex, outputBuffer, bufferInfo)
                                        }
                                    }
                                }

                                audioEncoder!!.releaseOutputBuffer(outputBufferIndex, false)
                            }
                        }
                        outputBufferIndex = audioEncoder?.dequeueOutputBuffer(bufferInfo, 0) ?: break
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Audio encoding error", e)
            }
        }, "AudioEncoder")
        audioThread?.start()
    }

    private fun pauseRecording() {
        if (isRecording && !isPaused) {
            isPaused = true
            pauseStartTime = System.currentTimeMillis()
            updateNotification("التسجيل متوقف مؤقتاً")
            onRecordingStateChanged?.invoke()
        }
    }

    private fun resumeRecording() {
        if (isRecording && isPaused) {
            isPaused = false
            pausedDuration += System.currentTimeMillis() - pauseStartTime
            updateNotification("جاري التسجيل...")
            onRecordingStateChanged?.invoke()
        }
    }

    private fun stopRecording() {
        isRunning.set(false)
        isRecording = false
        isPaused = false

        stopTimerUpdates()

        // Update floating bubble state back to idle
        try {
            val updateBubble = Intent(this, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_UPDATE_STATE
            }
            startService(updateBubble)
        } catch (_: Exception) {}

        // Wait for threads to finish
        try {
            videoThread?.join(2000)
            audioThread?.join(2000)
        } catch (e: InterruptedException) {
            Log.e(TAG, "Thread join interrupted", e)
        }

        cleanUp()

        // Save to gallery
        outputFile?.let { file ->
            if (file.exists() && file.length() > 0) {
                saveToGallery(file)
            }
        }

        onRecordingStateChanged?.invoke()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun cleanUp() {
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing AudioRecord", e)
        }

        try {
            videoEncoder?.stop()
            videoEncoder?.release()
            videoEncoder = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing video encoder", e)
        }

        try {
            audioEncoder?.stop()
            audioEncoder?.release()
            audioEncoder = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing audio encoder", e)
        }

        try {
            virtualDisplay?.release()
            virtualDisplay = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing virtual display", e)
        }

        try {
            inputSurface?.release()
            inputSurface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing input surface", e)
        }

        try {
            if (muxerStarted) {
                mediaMuxer?.stop()
            }
            mediaMuxer?.release()
            mediaMuxer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing muxer", e)
        }

        try {
            mediaProjection?.stop()
            mediaProjection = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping media projection", e)
        }

        muxerStarted = false
        tracksAdded = 0
        videoTrackIndex = -1
        audioTrackIndex = -1
    }

    private fun saveToGallery(file: File) {
        try {
            val contentValues = ContentValues().apply {
                put(MediaStore.Video.Media.DISPLAY_NAME, file.name)
                put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
                put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/تسجيلات الشاشة")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }

            val resolver = contentResolver
            val uri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, contentValues)

            uri?.let {
                resolver.openOutputStream(it)?.use { outputStream ->
                    FileInputStream(file).use { inputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }

                contentValues.clear()
                contentValues.put(MediaStore.Video.Media.IS_PENDING, 0)
                resolver.update(it, contentValues, null, null)

                Log.i(TAG, "Video saved to gallery: ${file.name}")

                // Send broadcast to notify gallery
                sendBroadcast(Intent(Intent.ACTION_MEDIA_SCANNER_SCAN_FILE, it))
            }

            // Clean up temp file
            file.delete()

        } catch (e: Exception) {
            Log.e(TAG, "Failed to save video to gallery", e)
        }
    }

    private fun startTimerUpdates() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (isRecording) {
                    val elapsed = if (isPaused) {
                        pauseStartTime - recordingStartTime - pausedDuration
                    } else {
                        System.currentTimeMillis() - recordingStartTime - pausedDuration
                    }
                    val seconds = (elapsed / 1000) % 60
                    val minutes = (elapsed / (1000 * 60)) % 60
                    val hours = elapsed / (1000 * 60 * 60)
                    val timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds)

                    val statusText = if (isPaused) "⏸ متوقف مؤقتاً - $timeStr" else "🔴 جاري التسجيل - $timeStr"
                    updateNotification(statusText)
                    onRecordingStateChanged?.invoke()

                    handler.postDelayed(this, 1000)
                }
            }
        }
        handler.post(timerRunnable!!)
    }

    private fun stopTimerUpdates() {
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isRunning.get()) {
            stopRecording()
        }
    }
}
