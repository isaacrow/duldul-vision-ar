package iq.masar.navigation.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import iq.masar.navigation.R

/**
 * 🇮🇶 Masar Iraq — Background Navigation Foreground Service
 * Keeps high-frequency GPS tracking and voice guidance active when phone screen locks
 * or driver switches to another app during driving.
 */
class NavigationService : Service(), LocationListener {

    private lateinit var locationManager: LocationManager
    private val channelId = "masar_navigation_service"
    private val notificationId = 1001

    override fun onCreate() {
        super.onCreate()
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        createNotificationChannel()
        startForeground(notificationId, buildNotification("بدء الملاحة المباشرة..."))
        startLocationUpdates()
    }

    private fun startLocationUpdates() {
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                1000L, // 1 second
                2f,    // 2 meters
                this
            )
        } catch (e: SecurityException) {
            stopSelf()
        }
    }

    override fun onLocationChanged(location: Location) {
        // Broadcast location to navigation state machine & UI
        val intent = Intent("iq.masar.LOCATION_UPDATE").apply {
            putExtra("lat", location.latitude)
            putExtra("lng", location.longitude)
            putExtra("bearing", location.bearing)
            putExtra("speed", location.speed)
            putExtra("accuracy", location.accuracy)
        }
        sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                getString(R.string.nav_service_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.nav_service_desc)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(text: String): Notification {
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("مسار العراق | الملاحة نشطة")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager.removeUpdates(this)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
