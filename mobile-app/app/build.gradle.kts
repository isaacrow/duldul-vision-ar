plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "iq.masar.navigation"
    compileSdk = 34

    defaultConfig {
        applicationId = "iq.masar.navigation"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0-pilot"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    // 100% Free Open-Source Map Rendering: MapLibre Native Android
    implementation("org.maplibre.gl:android-sdk:11.5.0")

    // AndroidX & Material UI Components
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.lifecycle:lifecycle-service:2.8.2")

    // CameraX Hardware Pipeline (Zero Simulation)
    val cameraVersion = "1.3.4"
    implementation("androidx.camera:camera-core:$cameraVersion")
    implementation("androidx.camera:camera-camera2:$cameraVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraVersion")
    implementation("androidx.camera:camera-view:$cameraVersion")

    // Google ML Kit On-Device Neural Vision (Text OCR + Road Object Detection)
    implementation("com.google.mlkit:text-recognition:16.0.0")
    implementation("com.google.mlkit:object-detection:17.0.1")

    // Networking for Free Routing Endpoints (OSRM / Valhalla)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Coroutines for Asynchronous GPS & Spatial Processing
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
}
