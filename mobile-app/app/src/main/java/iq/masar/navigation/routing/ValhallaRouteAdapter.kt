package iq.masar.navigation.routing

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class NavigationStep(
    val instruction: String,
    val distanceMeters: Int,
    val durationSeconds: Int,
    val lat: Double,
    val lng: Double
)

data class RouteResult(
    val distanceKm: Double,
    val durationMinutes: Int,
    val geometryGeoJson: String,
    val steps: List<NavigationStep>
)

/**
 * 🇮🇶 100% Free Routing Engine Adapter
 * Connects directly to OpenStreetMap / Valhalla / OSRM ($0 Cost).
 */
class ValhallaRouteAdapter(private val backendBaseUrl: String = "https://router.project-osrm.org") {

    private val client = OkHttpClient.Builder()
        .connectTimeout(8, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    suspend fun calculateRoute(
        startLat: Double, startLng: Double,
        endLat: Double, endLng: Double
    ): RouteResult? = withContext(Dispatchers.IO) {
        val url = "$backendBaseUrl/route/v1/driving/$startLng,$startLat;$endLng,$endLat?overview=full&geometries=geojson&steps=true"
        val request = Request.Builder().url(url).build()

        try {
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null

            val json = JSONObject(response.body?.string() ?: return@withContext null)
            val routes = json.optJSONArray("routes") ?: return@withContext null
            if (routes.length() == 0) return@withContext null

            val firstRoute = routes.getJSONObject(0)
            val distKm = firstRoute.getDouble("distance") / 1000.0
            val durMin = (firstRoute.getDouble("duration") / 60.0).toInt()
            val geometry = firstRoute.getJSONObject("geometry").toString()

            val stepsList = mutableListOf<NavigationStep>()
            val legs = firstRoute.optJSONArray("legs")
            if (legs != null && legs.length() > 0) {
                val steps = legs.getJSONObject(0).optJSONArray("steps")
                if (steps != null) {
                    for (i in 0 until steps.length()) {
                        val s = steps.getJSONObject(i)
                        val maneuver = s.optJSONObject("maneuver")
                        val loc = maneuver?.optJSONArray("location")
                        stepsList.add(
                            NavigationStep(
                                instruction = s.optString("name", "تابع على نفس المسار"),
                                distanceMeters = s.optDouble("distance", 0.0).toInt(),
                                durationSeconds = s.optDouble("duration", 0.0).toInt(),
                                lat = loc?.optDouble(1) ?: 0.0,
                                lng = loc?.optDouble(0) ?: 0.0
                            )
                        )
                    }
                }
            }

            RouteResult(
                distanceKm = Math.round(distKm * 10.0) / 10.0,
                durationMinutes = Math.max(1, durMin),
                geometryGeoJson = geometry,
                steps = stepsList
            )
        } catch (e: Exception) {
            null
        }
    }
}
