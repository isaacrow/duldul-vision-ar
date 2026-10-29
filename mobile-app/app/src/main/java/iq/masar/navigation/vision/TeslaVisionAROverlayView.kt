package iq.masar.navigation.vision

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.View

/**
 * Custom View rendering Tesla-style spatial cyber brackets, floating frosted pills,
 * and Bird's-Eye-View (BEV) radar over the camera stream.
 */
class TeslaVisionAROverlayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private val bracketsPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#00E5FF")
        style = Paint.Style.STROKE
        strokeWidth = 4f
        strokeCap = Paint.Cap.ROUND
    }

    private val badgeBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#D90B132B") // Dark Liquid Glass
        style = Paint.Style.FILL
    }

    private val badgeBorderPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#6600E5FF")
        style = Paint.Style.STROKE
        strokeWidth = 2f
    }

    private val textPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.WHITE
        textSize = 34f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }

    private val distancePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#38BDF8")
        textSize = 28f
        typeface = Typeface.MONOSPACE
    }

    private val horizonPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#2200E5FF")
        strokeWidth = 2f
    }

    private var detectedSigns: List<DetectedRoadSign> = emptyList()

    fun updateDetections(signs: List<DetectedRoadSign>) {
        this.detectedSigns = signs
        postInvalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val w = width.toFloat()
        val h = height.toFloat()

        // 1. Horizon & 3D floor line
        canvas.drawLine(0f, h * 0.52f, w, h * 0.52f, horizonPaint)

        // 2. Draw each genuine detected road sign
        for (sign in detectedSigns) {
            val rect = sign.boundingBox

            // Cyber brackets around detected sign
            drawCyberBrackets(canvas, rect)

            // Floating frosted pill badge above sign
            val labelText = sign.text
            val distText = "${sign.depthMeters}m"
            val textWidth = textPaint.measureText(labelText)
            val distWidth = distancePaint.measureText(distText)

            val pillW = (textWidth + distWidth + 60f).coerceAtLeast(180f)
            val pillH = 70f
            val pillX = rect.centerX() - (pillW / 2f)
            val pillY = (rect.top - 90f).coerceAtLeast(40f)

            val pillRect = RectF(pillX, pillY, pillX + pillW, pillY + pillH)
            canvas.drawRoundRect(pillRect, 35f, 35f, badgeBgPaint)
            canvas.drawRoundRect(pillRect, 35f, 35f, badgeBorderPaint)

            // Text and Distance
            canvas.drawText(labelText, pillX + 25f, pillY + 46f, textPaint)
            canvas.drawText(distText, pillX + pillW - distWidth - 25f, pillY + 46f, distancePaint)
        }
    }

    private fun drawCyberBrackets(canvas: Canvas, rect: Rect) {
        val corner = 24f
        val left = rect.left.toFloat()
        val top = rect.top.toFloat()
        val right = rect.right.toFloat()
        val bottom = rect.bottom.toFloat()

        // Top-Left
        canvas.drawLine(left, top + corner, left, top, bracketsPaint)
        canvas.drawLine(left, top, left + corner, top, bracketsPaint)

        // Top-Right
        canvas.drawLine(right - corner, top, right, top, bracketsPaint)
        canvas.drawLine(right, top, right, top + corner, bracketsPaint)

        // Bottom-Left
        canvas.drawLine(left, bottom - corner, left, bottom, bracketsPaint)
        canvas.drawLine(left, bottom, left + corner, bottom, bracketsPaint)

        // Bottom-Right
        canvas.drawLine(right - corner, bottom, right, bottom, bracketsPaint)
        canvas.drawLine(right, bottom, right, bottom - corner, bracketsPaint)
    }
}
