package com.moltbot.bridge.api

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.os.BatteryManager
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class SystemApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        if (method != "GET") return methodNotAllowed(method)

        return when (path) {
            "/info", "" -> getDeviceInfo()
            "/battery" -> getBatteryStatus()
            "/network" -> getNetworkStatus()
            else -> ApiResponse.notFound()
        }
    }

    private fun getDeviceInfo(): ApiResponse {
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        val displayMetrics = DisplayMetrics()
        
        @Suppress("DEPRECATION")
        windowManager.defaultDisplay.getMetrics(displayMetrics)

        val data = buildJsonObject {
            put("manufacturer", Build.MANUFACTURER)
            put("model", Build.MODEL)
            put("device", Build.DEVICE)
            put("brand", Build.BRAND)
            put("androidVersion", Build.VERSION.RELEASE)
            put("sdkVersion", Build.VERSION.SDK_INT)
            put("buildId", Build.ID)
            put("fingerprint", Build.FINGERPRINT)
            put("hardware", Build.HARDWARE)
            put("displayMetrics", buildJsonObject {
                put("widthPixels", displayMetrics.widthPixels)
                put("heightPixels", displayMetrics.heightPixels)
                put("density", displayMetrics.density.toDouble())
                put("densityDpi", displayMetrics.densityDpi)
            })
        }
        return success(data)
    }

    private fun getBatteryStatus(): ApiResponse {
        val batteryIntent = context.registerReceiver(
            null,
            IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        )

        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryLevel = if (level >= 0 && scale > 0) (level * 100 / scale) else -1

        val status = when (batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1)) {
            BatteryManager.BATTERY_STATUS_CHARGING -> "charging"
            BatteryManager.BATTERY_STATUS_DISCHARGING -> "discharging"
            BatteryManager.BATTERY_STATUS_FULL -> "full"
            BatteryManager.BATTERY_STATUS_NOT_CHARGING -> "not_charging"
            else -> "unknown"
        }

        val plugged = when (batteryIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1)) {
            BatteryManager.BATTERY_PLUGGED_AC -> "ac"
            BatteryManager.BATTERY_PLUGGED_USB -> "usb"
            BatteryManager.BATTERY_PLUGGED_WIRELESS -> "wireless"
            else -> "none"
        }

        val health = when (batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, -1)) {
            BatteryManager.BATTERY_HEALTH_GOOD -> "good"
            BatteryManager.BATTERY_HEALTH_OVERHEAT -> "overheat"
            BatteryManager.BATTERY_HEALTH_DEAD -> "dead"
            BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "over_voltage"
            BatteryManager.BATTERY_HEALTH_COLD -> "cold"
            else -> "unknown"
        }

        val temperature = (batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0) / 10.0
        val voltage = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0) ?: 0

        val data = buildJsonObject {
            put("level", batteryLevel)
            put("status", status)
            put("plugged", plugged)
            put("health", health)
            put("temperature", temperature)
            put("voltage", voltage)
        }
        return success(data)
    }

    private fun getNetworkStatus(): ApiResponse {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = network?.let { connectivityManager.getNetworkCapabilities(it) }

        val isConnected = capabilities != null
        val type = when {
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> "wifi"
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "cellular"
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) == true -> "ethernet"
            else -> "none"
        }

        val data = buildJsonObject {
            put("isConnected", isConnected)
            put("type", type)

            if (type == "wifi") {
                val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
                @Suppress("DEPRECATION")
                val wifiInfo = wifiManager.connectionInfo
                put("wifiInfo", buildJsonObject {
                    put("ssid", wifiInfo.ssid?.removeSurrounding("\"") ?: "unknown")
                    put("bssid", wifiInfo.bssid ?: "unknown")
                    put("rssi", wifiInfo.rssi)
                    put("linkSpeed", wifiInfo.linkSpeed)
                    put("frequency", wifiInfo.frequency)
                    @Suppress("DEPRECATION")
                    put("ipAddress", intToIp(wifiInfo.ipAddress))
                })
            }
        }
        return success(data)
    }

    private fun intToIp(i: Int): String {
        return "${i and 0xFF}.${(i shr 8) and 0xFF}.${(i shr 16) and 0xFF}.${(i shr 24) and 0xFF}"
    }
}
