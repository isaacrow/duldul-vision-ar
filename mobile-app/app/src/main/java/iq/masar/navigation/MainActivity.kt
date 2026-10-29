package iq.masar.navigation

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import iq.masar.navigation.databinding.ActivityMainBinding
import iq.masar.navigation.routing.RouteResult
import iq.masar.navigation.routing.ValhallaRouteAdapter
import iq.masar.navigation.service.NavigationService
import iq.masar.navigation.tts.VoiceGuidanceManager
import kotlinx.coroutines.launch
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.OnMapReadyCallback
import org.maplibre.android.maps.Style

/**
 * 🇮🇶 Masar Iraq — Native Android Navigation Pilot
 * Pure 100% Free Open-Source Stack: MapLibre Native + Ferrostar Guidance + Valhalla Routing
 * Styled in Apple Liquid Glass Aesthetic.
 */
class MainActivity : AppCompatActivity(), OnMapReadyCallback {

    private lateinit var binding: ActivityMainBinding
    private var mapLibreMap: MapLibreMap? = null
    private val routeAdapter = ValhallaRouteAdapter()
    private lateinit var voiceGuidance: VoiceGuidanceManager

    private var isNavigating = false
    private var currentRoute: RouteResult? = null
    private var userLocation: LatLng = LatLng(33.3152, 44.3661) // Baghdad Center default

    private val locationReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val lat = intent?.getDoubleExtra("lat", 0.0) ?: return
            val lng = intent.getDoubleExtra("lng", 0.0)
            val bearing = intent.getFloatExtra("bearing", 0f)

            userLocation = LatLng(lat, lng)

            if (isNavigating) {
                // Smoothly orient camera along driver's heading in 3D perspective
                val position = CameraPosition.Builder()
                    .target(userLocation)
                    .zoom(17.5)
                    .tilt(55.0)
                    .bearing(bearing.toDouble())
                    .build()
                mapLibreMap?.animateCamera(CameraUpdateFactory.newCameraPosition(position), 800)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        MapLibre.getInstance(this)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        voiceGuidance = VoiceGuidanceManager(this)
        binding.mapView.onCreate(savedInstanceState)
        binding.mapView.getMapAsync(this)

        setupListeners()
        requestLocationPermissions()
    }

    override fun onMapReady(map: MapLibreMap) {
        mapLibreMap = map
        map.setStyle(Style.Builder().fromUri("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json")) {
            val baghdad = CameraPosition.Builder()
                .target(userLocation)
                .zoom(14.0)
                .tilt(45.0)
                .build()
            map.cameraPosition = baghdad
        }

        map.addOnMapClickListener { point ->
            if (!isNavigating) {
                requestRouteTo(point)
            }
            true
        }
    }

    private fun requestRouteTo(destination: LatLng) {
        lifecycleScope.launch {
            val result = routeAdapter.calculateRoute(
                startLat = userLocation.latitude,
                startLng = userLocation.longitude,
                endLat = destination.latitude,
                endLng = destination.longitude
            )

            if (result != null) {
                currentRoute = result
                binding.tripEta.text = "${result.durationMinutes} دقيقة"
                binding.tripDetails.text = "المسافة: ${result.distanceKm} كم عبر شبكة الشوارع المفتوحة"
                binding.btnStartNav.visibility = View.VISIBLE
            }
        }
    }

    private fun setupListeners() {
        binding.btnStartNav.setOnClickListener {
            startDriveMode()
        }

        binding.btnStopNav.setOnClickListener {
            stopDriveMode()
        }
    }

    private fun startDriveMode() {
        isNavigating = true
        binding.maneuverHud.visibility = View.VISIBLE
        binding.btnStartNav.visibility = View.GONE

        // Start Foreground Service for reliable background GPS tracking
        val serviceIntent = Intent(this, NavigationService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        currentRoute?.steps?.firstOrNull()?.let { firstStep ->
            binding.hudInstruction.text = firstStep.instruction
            binding.hudDistance.text = "${firstStep.distanceMeters} م"
            voiceGuidance.speak(firstStep.instruction)
        }
    }

    private fun stopDriveMode() {
        isNavigating = false
        binding.maneuverHud.visibility = View.GONE
        binding.btnStartNav.visibility = View.VISIBLE

        stopService(Intent(this, NavigationService::class.java))

        // Reset camera to top-down 2D
        val overview = CameraPosition.Builder()
            .target(userLocation)
            .zoom(14.0)
            .tilt(0.0)
            .bearing(0.0)
            .build()
        mapLibreMap?.animateCamera(CameraUpdateFactory.newCameraPosition(overview), 1000)
    }

    private fun requestLocationPermissions() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, permissions, 101)
        }
    }

    override fun onStart() {
        super.onStart()
        binding.mapView.onStart()
        val filter = IntentFilter("iq.masar.LOCATION_UPDATE")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(locationReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(locationReceiver, filter)
        }
    }

    override fun onStop() {
        super.onStop()
        binding.mapView.onStop()
        try {
            unregisterReceiver(locationReceiver)
        } catch (e: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        binding.mapView.onDestroy()
        voiceGuidance.shutdown()
    }
}
