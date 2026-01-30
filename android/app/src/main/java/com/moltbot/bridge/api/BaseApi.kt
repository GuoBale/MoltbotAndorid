package com.moltbot.bridge.api

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.JsonElement

abstract class BaseApi(protected val context: Context) {

    abstract suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse

    protected fun checkPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) == 
            PackageManager.PERMISSION_GRANTED
    }

    protected fun requirePermission(permission: String): ApiResponse? {
        return if (!checkPermission(permission)) {
            ApiResponse.permissionDenied(permission.substringAfterLast("."))
        } else null
    }

    protected fun methodNotAllowed(method: String): ApiResponse {
        return ApiResponse.error("METHOD_NOT_ALLOWED", "Method $method not allowed")
    }

    protected fun success(data: JsonElement): ApiResponse.Success {
        return ApiResponse.success(data)
    }

    protected fun error(code: String, message: String): ApiResponse.Error {
        return ApiResponse.error(code, message)
    }
}
