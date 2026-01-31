package com.moltbot.bridge.service

import android.content.Context
import android.util.Log
import com.moltbot.bridge.api.*
import com.moltbot.bridge.protocol.ApiResponse
import fi.iki.elonen.NanoHTTPD
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.ByteArrayInputStream
import java.nio.charset.StandardCharsets

class BridgeServer(
    private val context: Context,
    port: Int
) : NanoHTTPD("127.0.0.1", port) {

    companion object {
        private const val TAG = "BridgeServer"
        private const val MIME_JSON_UTF8 = "application/json; charset=utf-8"
    }

    private val json = Json { 
        prettyPrint = true
        ignoreUnknownKeys = true
    }

    // API 模块
    private val apis = mapOf(
        // 核心功能
        "health" to HealthApi(context),
        "system" to SystemApi(context),
        
        // 通讯相关
        "contacts" to ContactsApi(context),
        "sms" to SmsApi(context),
        "calllog" to CallLogApi(context),
        
        // 应用与媒体
        "apps" to AppsApi(context),
        "media" to MediaApi(context),
        "calendar" to CalendarApi(context),
        
        // 系统工具
        "clipboard" to ClipboardApi(context),
        "tts" to TtsApi(context),
        "intent" to IntentApi(context),
        
        // 位置与传感器
        "location" to LocationApi(context),
        "sensor" to SensorApi(context),
        
        // 音量与通知
        "volume" to VolumeApi(context),
        "alarm" to AlarmApi(context),
        "notification" to NotificationApi(context),
        "dnd" to DndApi(context),
        
        // 连接与硬件
        "wifi" to WifiApi(context),
        "bluetooth" to BluetoothApi(context),
        "flashlight" to FlashlightApi(context),
        "vibration" to VibrationApi(context),
        "screen" to ScreenApi(context),
        
        // 存储与文件
        "storage" to StorageApi(context),
        "file" to FileApi(context),
        "download" to DownloadApi(context),
        
        // 相机与录音
        "camera" to CameraApi(context),
        "recorder" to RecorderApi(context),
        "appshortcuts" to AppShortcutsApi(context),
        "root" to RootApi(context),
    )

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        val method = session.method

        Log.d(TAG, "Request: $method $uri")

        return try {
            val startTime = System.currentTimeMillis()
            val result = handleRequest(session)
            val duration = System.currentTimeMillis() - startTime

            val response = when (result) {
                is ApiResponse.Success -> {
                    result.copy(
                        meta = result.meta.copy(durationMs = duration)
                    )
                }
                is ApiResponse.Error -> result
            }

            createUtf8Response(
                if (result is ApiResponse.Success) Response.Status.OK else getErrorStatus(result),
                json.encodeToString(response)
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error handling request", e)
            val errorResponse = ApiResponse.Error(
                error = ApiResponse.ErrorBody(
                    code = "INTERNAL_ERROR",
                    message = e.message ?: "Unknown error"
                )
            )
            createUtf8Response(
                Response.Status.INTERNAL_ERROR,
                json.encodeToString(errorResponse)
            )
        }
    }

    /**
     * 创建 UTF-8 编码的 JSON 响应
     */
    private fun createUtf8Response(status: Response.Status, jsonString: String): Response {
        val bytes = jsonString.toByteArray(StandardCharsets.UTF_8)
        val inputStream = ByteArrayInputStream(bytes)
        return newFixedLengthResponse(status, MIME_JSON_UTF8, inputStream, bytes.size.toLong())
    }

    private fun handleRequest(session: IHTTPSession): ApiResponse {
        val uri = session.uri
        val method = session.method.name

        // 解析路径: /api/v1/{module}/{...}
        val pathParts = uri.removePrefix("/api/v1/").split("/")
        if (pathParts.isEmpty()) {
            return ApiResponse.Error(
                error = ApiResponse.ErrorBody(
                    code = "NOT_FOUND",
                    message = "Endpoint not found"
                )
            )
        }

        val moduleName = pathParts[0]
        val subPath = if (pathParts.size > 1) "/" + pathParts.drop(1).joinToString("/") else ""

        val api = apis[moduleName]
        if (api == null) {
            return ApiResponse.Error(
                error = ApiResponse.ErrorBody(
                    code = "NOT_FOUND",
                    message = "Module not found: $moduleName"
                )
            )
        }

        // 解析查询参数
        val params = mutableMapOf<String, String>()
        session.parms?.forEach { (key, value) ->
            params[key] = value
        }

        // 解析请求体（确保 UTF-8 编码）
        val body = if (method == "POST" || method == "PUT" || method == "PATCH") {
            try {
                val contentLength = session.headers["content-length"]?.toIntOrNull() ?: 0
                if (contentLength > 0) {
                    // 直接从 inputStream 读取原始字节，确保 UTF-8 解码
                    val buffer = ByteArray(contentLength)
                    var totalRead = 0
                    while (totalRead < contentLength) {
                        val read = session.inputStream.read(buffer, totalRead, contentLength - totalRead)
                        if (read == -1) break
                        totalRead += read
                    }
                    String(buffer, 0, totalRead, StandardCharsets.UTF_8)
                } else {
                    // 尝试使用 parseBody 方法
                    val files = mutableMapOf<String, String>()
                    session.parseBody(files)
                    files["postData"]
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing body", e)
                null
            }
        } else null

        return runBlocking {
            api.handleRequest(method, subPath, params, body)
        }
    }

    private fun getErrorStatus(response: ApiResponse): Response.Status {
        return when ((response as? ApiResponse.Error)?.error?.code) {
            "NOT_FOUND" -> Response.Status.NOT_FOUND
            "PERMISSION_DENIED" -> Response.Status.FORBIDDEN
            "INVALID_PARAMS" -> Response.Status.BAD_REQUEST
            else -> Response.Status.INTERNAL_ERROR
        }
    }
}
