package com.moltbot.bridge.api

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put

class ClipboardApi(context: Context) : BaseApi(context) {

    private val clipboardManager = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        return when {
            method == "GET" && path.isEmpty() -> getClipboard()
            method == "POST" && path.isEmpty() -> setClipboard(body)
            else -> ApiResponse.notFound()
        }
    }

    private fun getClipboard(): ApiResponse {
        val clip = clipboardManager.primaryClip
        val hasContent = clip != null && clip.itemCount > 0

        val data = buildJsonObject {
            put("hasContent", hasContent)
            if (hasContent && clip != null) {
                val item = clip.getItemAt(0)
                item.text?.let { put("text", it.toString()) }
                item.htmlText?.let { put("htmlText", it) }
                item.uri?.let { put("uri", it.toString()) }
            }
        }
        return success(data)
    }

    private fun setClipboard(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val text = json["text"]?.jsonPrimitive?.content
            ?: return ApiResponse.invalidParams("Missing 'text' field")
        val label = json["label"]?.jsonPrimitive?.content ?: "Copied text"

        clipboardManager.setPrimaryClip(ClipData.newPlainText(label, text))

        val data = buildJsonObject {
            put("copied", true)
        }
        return success(data)
    }
}
