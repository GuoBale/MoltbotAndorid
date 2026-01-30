package com.moltbot.bridge.api

import android.content.Context
import android.os.SystemClock
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class HealthApi(context: Context) : BaseApi(context) {

    private val startTime = System.currentTimeMillis()

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        return when {
            method == "GET" && path.isEmpty() -> getHealth()
            else -> ApiResponse.notFound()
        }
    }

    private fun getHealth(): ApiResponse {
        val uptime = (System.currentTimeMillis() - startTime) / 1000
        val data = buildJsonObject {
            put("status", "running")
            put("uptime", uptime)
            put("version", "1.0.0")
            put("uptimeMs", SystemClock.elapsedRealtime())
        }
        return success(data)
    }
}
