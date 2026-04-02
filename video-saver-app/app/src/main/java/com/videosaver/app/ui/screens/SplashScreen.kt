package com.videosaver.app.ui.screens

import androidx.compose.animation.animateColor
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.videosaver.app.ui.theme.AccentPurple
import com.videosaver.app.ui.theme.PrimaryBlue
import com.videosaver.app.ui.theme.PrimaryBlueDark
import com.videosaver.app.ui.theme.PrimaryBlueLight
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onFinished: () -> Unit
) {
    var progress by remember { mutableIntStateOf(0) }
    var loadingText by remember { mutableStateOf("جاري تحضير التطبيق...") }

    val animatedProgress by animateFloatAsState(
        targetValue = progress / 100f,
        animationSpec = tween(durationMillis = 300),
        label = "progress"
    )

    // Rotating arc animation
    val infiniteTransition = rememberInfiniteTransition(label = "splash")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    // Color animation for gradient
    val glowColor by infiniteTransition.animateColor(
        initialValue = PrimaryBlue,
        targetValue = AccentPurple,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow"
    )

    LaunchedEffect(Unit) {
        // Simulate loading progress with varied speeds
        val stages = listOf(
            Triple(0, 20, 40L),      // Fast start
            Triple(20, 40, 60L),     // Medium
            Triple(40, 60, 50L),     // Slightly faster
            Triple(60, 80, 70L),     // Slower
            Triple(80, 95, 80L),     // Even slower
            Triple(95, 100, 100L)    // Final push
        )

        val texts = mapOf(
            0 to "جاري تحضير التطبيق...",
            20 to "تحميل الواجهة...",
            40 to "تهيئة محرك التحميل...",
            60 to "ربط المنصات...",
            80 to "اللمسات الأخيرة...",
            95 to "جاهز!"
        )

        for ((start, end, delayMs) in stages) {
            for (i in start..end) {
                progress = i
                texts[i]?.let { loadingText = it }
                delay(delayMs)
            }
        }

        delay(400) // Brief pause at 100%
        onFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        PrimaryBlueDark,
                        Color(0xFF1A237E),
                        Color(0xFF0D1B3E)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            // Animated circular progress with rotating arc
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(180.dp)
            ) {
                // Outer rotating arc
                Canvas(modifier = Modifier.size(180.dp)) {
                    drawArc(
                        brush = Brush.sweepGradient(
                            colors = listOf(
                                Color.Transparent,
                                PrimaryBlueLight.copy(alpha = 0.3f),
                                PrimaryBlue.copy(alpha = 0.6f),
                                Color.Transparent
                            )
                        ),
                        startAngle = rotation,
                        sweepAngle = 270f,
                        useCenter = false,
                        style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round),
                        size = Size(size.width, size.height)
                    )
                }

                // Progress circle background
                Canvas(modifier = Modifier.size(160.dp)) {
                    drawArc(
                        color = Color.White.copy(alpha = 0.1f),
                        startAngle = -90f,
                        sweepAngle = 360f,
                        useCenter = false,
                        style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                // Progress circle fill
                Canvas(modifier = Modifier.size(160.dp)) {
                    drawArc(
                        brush = Brush.sweepGradient(
                            colors = listOf(PrimaryBlue, glowColor, PrimaryBlueLight),
                            center = Offset(size.width / 2, size.height / 2)
                        ),
                        startAngle = -90f,
                        sweepAngle = animatedProgress * 360f,
                        useCenter = false,
                        style = Stroke(width = 8.dp.toPx(), cap = StrokeCap.Round)
                    )
                }

                // Center content
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Play icon (triangle)
                    Canvas(modifier = Modifier.size(32.dp)) {
                        val path = androidx.compose.ui.graphics.Path().apply {
                            moveTo(size.width * 0.2f, size.height * 0.1f)
                            lineTo(size.width * 0.9f, size.height * 0.5f)
                            lineTo(size.width * 0.2f, size.height * 0.9f)
                            close()
                        }
                        drawPath(path, color = Color.White)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Percentage text
                    Text(
                        text = "$progress%",
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            // App name
            Text(
                text = "Video Saver",
                color = Color.White,
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Tagline
            Text(
                text = "حمّل مقاطعك المفضلة بسهولة",
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 14.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Loading text
            Text(
                text = loadingText,
                color = Color.White.copy(alpha = 0.6f),
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Progress bar at bottom
            Box(
                modifier = Modifier
                    .fillMaxWidth(0.6f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White.copy(alpha = 0.1f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(animatedProgress)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(PrimaryBlue, glowColor)
                            )
                        )
                )
            }
        }
    }
}
