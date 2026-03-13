package com.ali.screenrecorder

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.File

class MainActivity : AppCompatActivity() {

    companion object {
        private const val REQUEST_PERMISSIONS = 100
        private const val REQUEST_OVERLAY_PERMISSION = 101
    }

    private lateinit var btnRecord: Button
    private lateinit var txtStatus: TextView
    private lateinit var txtTimer: TextView
    private lateinit var recordingIndicator: View
    private lateinit var switchMic: Switch
    private lateinit var recordingsContainer: LinearLayout
    private lateinit var txtNoRecordings: TextView

    private var resultCode: Int = 0
    private var resultData: Intent? = null
    private var launchedFromBubble = false

    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    private val mediaProjectionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK && result.data != null) {
            resultCode = result.resultCode
            resultData = result.data
            startRecordingService()
        } else {
            Toast.makeText(this, "تم رفض إذن التسجيل", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupListeners()
        setupBubbleCallbacks()
        checkPermissions()
        updateUI()
        loadRecordings()

        // Launch floating bubble on app start
        launchFloatingBubble()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
        startUITimer()
    }

    override fun onPause() {
        super.onPause()
        stopUITimer()
    }

    private fun initViews() {
        btnRecord = findViewById(R.id.btnRecord)
        txtStatus = findViewById(R.id.txtStatus)
        txtTimer = findViewById(R.id.txtTimer)
        recordingIndicator = findViewById(R.id.recordingIndicator)
        switchMic = findViewById(R.id.switchMic)
        recordingsContainer = findViewById(R.id.recordingsContainer)
        txtNoRecordings = findViewById(R.id.txtNoRecordings)

        ScreenRecorderService.onRecordingStateChanged = {
            handler.post { updateUI() }
        }
    }

    private fun setupListeners() {
        btnRecord.setOnClickListener {
            if (ScreenRecorderService.isRecording) {
                stopRecording()
            } else {
                launchedFromBubble = false
                requestScreenCapture()
            }
        }
    }

    private fun setupBubbleCallbacks() {
        FloatingBubbleService.onBubbleRecordClicked = {
            handler.post {
                launchedFromBubble = true
                requestScreenCapture()
            }
        }

        FloatingBubbleService.onBubbleStopClicked = {
            handler.post {
                stopRecording()
            }
        }

        FloatingBubbleService.onBubblePauseClicked = {
            handler.post {
                if (ScreenRecorderService.isPaused) {
                    val resumeIntent = Intent(this, ScreenRecorderService::class.java).apply {
                        action = ScreenRecorderService.ACTION_RESUME
                    }
                    startService(resumeIntent)
                } else {
                    val pauseIntent = Intent(this, ScreenRecorderService::class.java).apply {
                        action = ScreenRecorderService.ACTION_PAUSE
                    }
                    startService(pauseIntent)
                }
            }
        }
    }

    private fun launchFloatingBubble() {
        if (!checkOverlayPermission()) {
            requestOverlayPermission()
            return
        }
        val bubbleIntent = Intent(this, FloatingBubbleService::class.java).apply {
            action = FloatingBubbleService.ACTION_SHOW_BUBBLE
        }
        startForegroundService(bubbleIntent)
    }

    private fun checkPermissions() {
        val permissions = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.POST_NOTIFICATIONS)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO)
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_MEDIA_VIDEO)
            }
        }

        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), REQUEST_PERMISSIONS)
        }
    }

    private fun checkOverlayPermission(): Boolean {
        return Settings.canDrawOverlays(this)
    }

    private fun requestOverlayPermission() {
        AlertDialog.Builder(this)
            .setTitle("صلاحية العرض فوق التطبيقات")
            .setMessage("يحتاج التطبيق صلاحية العرض فوق التطبيقات لإظهار الأيقونة العائمة على الشاشة")
            .setPositiveButton("فتح الإعدادات") { _, _ ->
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName")
                )
                @Suppress("DEPRECATION")
                startActivityForResult(intent, REQUEST_OVERLAY_PERMISSION)
            }
            .setNegativeButton("لاحقاً", null)
            .show()
    }

    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_OVERLAY_PERMISSION) {
            if (checkOverlayPermission()) {
                launchFloatingBubble()
            }
        }
    }

    private fun requestScreenCapture() {
        // Check overlay permission first
        if (!checkOverlayPermission()) {
            requestOverlayPermission()
            return
        }

        // Check audio permission
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO),
                REQUEST_PERMISSIONS
            )
            return
        }

        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjectionLauncher.launch(projectionManager.createScreenCaptureIntent())
    }

    private fun startRecordingService() {
        val serviceIntent = Intent(this, ScreenRecorderService::class.java).apply {
            action = ScreenRecorderService.ACTION_START
            putExtra(ScreenRecorderService.EXTRA_RESULT_CODE, resultCode)
            putExtra(ScreenRecorderService.EXTRA_RESULT_DATA, resultData)
            putExtra(ScreenRecorderService.EXTRA_INCLUDE_MIC, switchMic.isChecked)
        }
        startForegroundService(serviceIntent)

        // Update bubble state
        val updateBubble = Intent(this, FloatingBubbleService::class.java).apply {
            action = FloatingBubbleService.ACTION_UPDATE_STATE
        }
        startService(updateBubble)

        // Minimize app after starting recording
        handler.postDelayed({
            moveTaskToBack(true)
        }, 500)
    }

    private fun stopRecording() {
        val stopIntent = Intent(this, ScreenRecorderService::class.java).apply {
            action = ScreenRecorderService.ACTION_STOP
        }
        startService(stopIntent)

        // Update bubble state
        handler.postDelayed({
            val updateBubble = Intent(this, FloatingBubbleService::class.java).apply {
                action = FloatingBubbleService.ACTION_UPDATE_STATE
            }
            startService(updateBubble)
        }, 500)
    }

    private fun updateUI() {
        if (ScreenRecorderService.isRecording) {
            btnRecord.text = "إيقاف التسجيل"
            btnRecord.setBackgroundResource(R.drawable.btn_stop_background)

            if (ScreenRecorderService.isPaused) {
                txtStatus.text = "⏸ التسجيل متوقف مؤقتاً"
                txtStatus.setTextColor(ContextCompat.getColor(this, R.color.warning_color))
                recordingIndicator.visibility = View.INVISIBLE
            } else {
                txtStatus.text = "🔴 جاري التسجيل..."
                txtStatus.setTextColor(ContextCompat.getColor(this, R.color.recording_color))
                recordingIndicator.visibility = View.VISIBLE
            }

            // Update timer
            val elapsed = System.currentTimeMillis() - ScreenRecorderService.recordingStartTime - ScreenRecorderService.pausedDuration
            val seconds = (elapsed / 1000) % 60
            val minutes = (elapsed / (1000 * 60)) % 60
            val hours = elapsed / (1000 * 60 * 60)
            txtTimer.text = String.format("%02d:%02d:%02d", hours, minutes, seconds)
            txtTimer.visibility = View.VISIBLE

            switchMic.isEnabled = false
        } else {
            btnRecord.text = "بدء التسجيل"
            btnRecord.setBackgroundResource(R.drawable.btn_record_background)
            txtStatus.text = "جاهز للتسجيل"
            txtStatus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary))
            txtTimer.visibility = View.GONE
            recordingIndicator.visibility = View.GONE
            switchMic.isEnabled = true

            // Refresh recordings list
            loadRecordings()
        }
    }

    private fun startUITimer() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (ScreenRecorderService.isRecording) {
                    updateUI()
                }
                handler.postDelayed(this, 500)
            }
        }
        handler.post(timerRunnable!!)
    }

    private fun stopUITimer() {
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
    }

    private fun loadRecordings() {
        recordingsContainer.removeAllViews()

        val recordings = mutableListOf<RecordingItem>()

        // Query MediaStore for recordings in our folder
        val projection = arrayOf(
            android.provider.MediaStore.Video.Media._ID,
            android.provider.MediaStore.Video.Media.DISPLAY_NAME,
            android.provider.MediaStore.Video.Media.DATE_ADDED,
            android.provider.MediaStore.Video.Media.SIZE,
            android.provider.MediaStore.Video.Media.DURATION
        )

        val selection = "${android.provider.MediaStore.Video.Media.RELATIVE_PATH} LIKE ?"
        val selectionArgs = arrayOf("%تسجيلات الشاشة%")
        val sortOrder = "${android.provider.MediaStore.Video.Media.DATE_ADDED} DESC"

        try {
            contentResolver.query(
                android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )?.use { cursor ->
                val idColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Video.Media._ID)
                val nameColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Video.Media.DISPLAY_NAME)
                val dateColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Video.Media.DATE_ADDED)
                val sizeColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Video.Media.SIZE)
                val durationColumn = cursor.getColumnIndexOrThrow(android.provider.MediaStore.Video.Media.DURATION)

                while (cursor.moveToNext()) {
                    val id = cursor.getLong(idColumn)
                    val name = cursor.getString(nameColumn)
                    val date = cursor.getLong(dateColumn) * 1000
                    val size = cursor.getLong(sizeColumn)
                    val duration = cursor.getLong(durationColumn)
                    val uri = android.content.ContentUris.withAppendedId(
                        android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id
                    )
                    recordings.add(RecordingItem(name, date, size, duration, uri))
                }
            }
        } catch (_: Exception) {}

        if (recordings.isEmpty()) {
            txtNoRecordings.visibility = View.VISIBLE
        } else {
            txtNoRecordings.visibility = View.GONE
            for (item in recordings) {
                addRecordingView(item)
            }
        }
    }

    private fun addRecordingView(item: RecordingItem) {
        val view = layoutInflater.inflate(R.layout.item_recording, recordingsContainer, false)

        val txtName = view.findViewById<TextView>(R.id.txtRecordingName)
        val txtInfo = view.findViewById<TextView>(R.id.txtRecordingInfo)
        val btnPlay = view.findViewById<ImageView>(R.id.btnPlayRecording)
        val btnShare = view.findViewById<ImageView>(R.id.btnShareRecording)

        txtName.text = item.name

        val sizeStr = formatFileSize(item.size)
        val durationStr = formatDuration(item.duration)
        val dateStr = java.text.SimpleDateFormat("yyyy/MM/dd - HH:mm", java.util.Locale.getDefault())
            .format(java.util.Date(item.date))
        txtInfo.text = "$dateStr | $durationStr | $sizeStr"

        btnPlay.setOnClickListener {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(item.uri, "video/mp4")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            try {
                startActivity(intent)
            } catch (_: Exception) {
                Toast.makeText(this, "لا يوجد تطبيق لتشغيل الفيديو", Toast.LENGTH_SHORT).show()
            }
        }

        btnShare.setOnClickListener {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "video/mp4"
                putExtra(Intent.EXTRA_STREAM, item.uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "مشاركة التسجيل"))
        }

        recordingsContainer.addView(view)
    }

    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> String.format("%.1f KB", bytes / 1024.0)
            bytes < 1024 * 1024 * 1024 -> String.format("%.1f MB", bytes / (1024.0 * 1024.0))
            else -> String.format("%.1f GB", bytes / (1024.0 * 1024.0 * 1024.0))
        }
    }

    private fun formatDuration(millis: Long): String {
        val seconds = (millis / 1000) % 60
        val minutes = (millis / (1000 * 60)) % 60
        val hours = millis / (1000 * 60 * 60)
        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, minutes, seconds)
        } else {
            String.format("%d:%02d", minutes, seconds)
        }
    }

    data class RecordingItem(
        val name: String,
        val date: Long,
        val size: Long,
        val duration: Long,
        val uri: Uri
    )
}
