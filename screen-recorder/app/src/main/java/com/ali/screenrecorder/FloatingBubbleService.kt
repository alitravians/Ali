package com.ali.screenrecorder

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

class FloatingBubbleService : Service() {

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "floating_bubble_channel"
        const val NOTIFICATION_ID = 2001
        const val ACTION_SHOW_BUBBLE = "ACTION_SHOW_BUBBLE"
        const val ACTION_HIDE_BUBBLE = "ACTION_HIDE_BUBBLE"
        const val ACTION_UPDATE_STATE = "ACTION_UPDATE_STATE"
        const val ACTION_SHOW_COUNTDOWN = "ACTION_SHOW_COUNTDOWN"

        var onBubbleRecordClicked: (() -> Unit)? = null
        var onBubbleStopClicked: (() -> Unit)? = null
        var onBubblePauseClicked: (() -> Unit)? = null
    }

    private var windowManager: WindowManager? = null
    private var bubbleView: View? = null
    private var expandedView: View? = null
    private var countdownView: View? = null
    private var isExpanded = false

    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        setupBubbleView()
        setupExpandedView()
        setupCountdownView()
        startTimerUpdate()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_UPDATE_STATE -> {
                updateBubbleAppearance()
                if (isExpanded) updateExpandedUI()
            }
            ACTION_SHOW_COUNTDOWN -> {
                showCountdown()
            }
            ACTION_HIDE_BUBBLE -> {
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "فقاعة التحكم",
            NotificationManager.IMPORTANCE_MIN
        ).apply {
            description = "إشعار فقاعة التحكم بالتسجيل"
            setShowBadge(false)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("مسجل الشاشة")
            .setContentText("الأيقونة العائمة نشطة")
            .setSmallIcon(R.drawable.ic_record)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()
    }

    private fun setupBubbleView() {
        bubbleView = LayoutInflater.from(this).inflate(R.layout.floating_bubble, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 400
        }

        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isDragging = false

        bubbleView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isDragging = true
                    }
                    params.x = initialX + dx
                    params.y = initialY + dy
                    try {
                        windowManager?.updateViewLayout(bubbleView, params)
                    } catch (_: Exception) {}
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        if (ScreenRecorderService.isRecording) {
                            toggleExpanded()
                        } else {
                            // Quick start: show countdown then trigger recording
                            showCountdown()
                        }
                    }
                    true
                }
                else -> false
            }
        }

        updateBubbleAppearance()
        windowManager?.addView(bubbleView, params)
    }

    private fun updateBubbleAppearance() {
        val bubbleIcon = bubbleView?.findViewById<ImageView>(R.id.bubbleIcon)
        val bubbleTimer = bubbleView?.findViewById<TextView>(R.id.bubbleTimer)

        if (ScreenRecorderService.isRecording) {
            bubbleIcon?.setImageResource(R.drawable.ic_record_active)
            bubbleTimer?.visibility = View.VISIBLE
        } else {
            bubbleIcon?.setImageResource(R.drawable.ic_bubble_record)
            bubbleTimer?.visibility = View.GONE
            bubbleTimer?.text = ""
        }
    }

    private fun setupExpandedView() {
        expandedView = LayoutInflater.from(this).inflate(R.layout.floating_expanded, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        expandedView?.findViewById<LinearLayout>(R.id.btnStop)?.setOnClickListener {
            onBubbleStopClicked?.invoke()
            toggleExpanded()
        }

        expandedView?.findViewById<LinearLayout>(R.id.btnPauseResume)?.setOnClickListener {
            onBubblePauseClicked?.invoke()
            handler.postDelayed({ updateExpandedUI() }, 200)
        }

        expandedView?.findViewById<ImageView>(R.id.btnClose)?.setOnClickListener {
            toggleExpanded()
        }

        expandedView?.visibility = View.GONE
        windowManager?.addView(expandedView, params)
    }

    private fun setupCountdownView() {
        countdownView = LayoutInflater.from(this).inflate(R.layout.floating_countdown, null)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
        }

        countdownView?.visibility = View.GONE
        windowManager?.addView(countdownView, params)
    }

    private fun showCountdown() {
        countdownView?.visibility = View.VISIBLE
        val txtCountdown = countdownView?.findViewById<TextView>(R.id.txtCountdown)

        txtCountdown?.text = "3"
        handler.postDelayed({
            txtCountdown?.text = "2"
        }, 1000)
        handler.postDelayed({
            txtCountdown?.text = "1"
        }, 2000)
        handler.postDelayed({
            countdownView?.visibility = View.GONE
            onBubbleRecordClicked?.invoke()
        }, 3000)
    }

    private fun toggleExpanded() {
        isExpanded = !isExpanded
        if (isExpanded) {
            expandedView?.visibility = View.VISIBLE
            updateExpandedUI()
        } else {
            expandedView?.visibility = View.GONE
        }
    }

    private fun updateExpandedUI() {
        val pauseResumeText = expandedView?.findViewById<TextView>(R.id.txtPauseResume)
        val pauseResumeIcon = expandedView?.findViewById<ImageView>(R.id.iconPauseResume)

        if (ScreenRecorderService.isPaused) {
            pauseResumeText?.text = "استئناف"
            pauseResumeIcon?.setImageResource(R.drawable.ic_resume)
        } else {
            pauseResumeText?.text = "إيقاف مؤقت"
            pauseResumeIcon?.setImageResource(R.drawable.ic_pause)
        }
    }

    private fun startTimerUpdate() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (ScreenRecorderService.isRecording) {
                    val elapsed = System.currentTimeMillis() - ScreenRecorderService.recordingStartTime - ScreenRecorderService.pausedDuration
                    val seconds = (elapsed / 1000) % 60
                    val minutes = (elapsed / (1000 * 60)) % 60
                    val hours = elapsed / (1000 * 60 * 60)
                    val timeStr = String.format("%02d:%02d:%02d", hours, minutes, seconds)

                    bubbleView?.findViewById<TextView>(R.id.bubbleTimer)?.text = timeStr
                    expandedView?.findViewById<TextView>(R.id.expandedTimer)?.text = timeStr

                    if (isExpanded) {
                        updateExpandedUI()
                    }
                }
                updateBubbleAppearance()
                handler.postDelayed(this, 500)
            }
        }
        handler.post(timerRunnable!!)
    }

    override fun onDestroy() {
        super.onDestroy()
        timerRunnable?.let { handler.removeCallbacks(it) }
        try {
            bubbleView?.let { windowManager?.removeView(it) }
        } catch (_: Exception) {}
        try {
            expandedView?.let { windowManager?.removeView(it) }
        } catch (_: Exception) {}
        try {
            countdownView?.let { windowManager?.removeView(it) }
        } catch (_: Exception) {}
    }
}
