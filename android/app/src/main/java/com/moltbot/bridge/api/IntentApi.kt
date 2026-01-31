package com.moltbot.bridge.api

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.*

class IntentApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        if (method != "POST") return methodNotAllowed(method)

        return when (path) {
            "/send" -> sendIntent(body)
            "/share" -> share(body)
            "/dial" -> dial(body)
            "/open" -> openUrl(body)
            else -> ApiResponse.notFound()
        }
    }

    private fun sendIntent(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val action = json["action"]?.jsonPrimitive?.contentOrNull
            ?: Intent.ACTION_VIEW
        val data = json["data"]?.jsonPrimitive?.contentOrNull
        val type = json["type"]?.jsonPrimitive?.contentOrNull
        val packageName = json["package"]?.jsonPrimitive?.contentOrNull

        val intent = Intent(action).apply {
            data?.let { this.data = Uri.parse(it) }
            type?.let { this.type = it }
            packageName?.let { this.setPackage(it) }
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            // 处理 extras
            json["extras"]?.jsonObject?.forEach { (key, value) ->
                when (value) {
                    is JsonPrimitive -> {
                        when {
                            value.isString -> putExtra(key, value.content)
                            value.booleanOrNull != null -> putExtra(key, value.boolean)
                            value.intOrNull != null -> putExtra(key, value.int)
                            value.longOrNull != null -> putExtra(key, value.long)
                            value.doubleOrNull != null -> putExtra(key, value.double)
                        }
                    }
                    else -> {}
                }
            }

            // 处理 categories
            json["categories"]?.jsonArray?.forEach { cat ->
                cat.jsonPrimitive.contentOrNull?.let { addCategory(it) }
            }

            // 处理 flags
            json["flags"]?.jsonArray?.forEach { flag ->
                flag.jsonPrimitive.contentOrNull?.let { flagName ->
                    when (flagName) {
                        "FLAG_ACTIVITY_NEW_TASK" -> addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        "FLAG_ACTIVITY_CLEAR_TOP" -> addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        "FLAG_ACTIVITY_SINGLE_TOP" -> addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        "FLAG_GRANT_READ_URI_PERMISSION" -> addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    }
                }
            }
        }

        return try {
            context.startActivity(intent)
            val responseData = buildJsonObject {
                put("sent", true)
            }
            success(responseData)
        } catch (e: Exception) {
            ApiResponse.error("INTENT_FAILED", e.message ?: "Failed to send intent")
        }
    }

    private fun share(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val text = json["text"]?.jsonPrimitive?.contentOrNull
        val title = json["title"]?.jsonPrimitive?.contentOrNull ?: "分享"
        val type = json["type"]?.jsonPrimitive?.contentOrNull ?: "text/plain"

        if (text == null) {
            return ApiResponse.invalidParams("Missing 'text' field")
        }

        val intent = Intent(Intent.ACTION_SEND).apply {
            this.type = type
            putExtra(Intent.EXTRA_TEXT, text)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        val chooser = Intent.createChooser(intent, title).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(chooser)
            val data = buildJsonObject {
                put("shared", true)
            }
            success(data)
        } catch (e: Exception) {
            ApiResponse.error("SHARE_FAILED", e.message ?: "Failed to share")
        }
    }

    private fun dial(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val number = json["number"]?.jsonPrimitive?.contentOrNull
            ?: return ApiResponse.invalidParams("Missing 'number' field")

        // 有 CALL_PHONE 权限时直接拨打电话（ACTION_CALL），否则仅打开拨号界面（ACTION_DIAL）
        val hasCallPermission = checkPermission(Manifest.permission.CALL_PHONE)
        val action = if (hasCallPermission) Intent.ACTION_CALL else Intent.ACTION_DIAL

        val intent = Intent(action).apply {
            data = Uri.parse("tel:$number")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(intent)
            val data = buildJsonObject {
                put("dialed", true)
                put("number", number)
                put("callPlaced", hasCallPermission)
                if (!hasCallPermission) {
                    put("note", "无拨打电话权限，已打开拨号界面，请在手机上点击拨打键。授予 CALL_PHONE 权限后可自动拨出。")
                }
            }
            success(data)
        } catch (e: Exception) {
            ApiResponse.error("DIAL_FAILED", e.message ?: "Failed to dial")
        }
    }

    private fun openUrl(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val url = json["url"]?.jsonPrimitive?.contentOrNull
            ?: return ApiResponse.invalidParams("Missing 'url' field")

        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse(url)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

        return try {
            context.startActivity(intent)
            val data = buildJsonObject {
                put("opened", true)
                put("url", url)
            }
            success(data)
        } catch (e: Exception) {
            ApiResponse.error("OPEN_FAILED", e.message ?: "Failed to open URL")
        }
    }
}
