package com.moltbot.bridge.api

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.util.Locale
import java.util.UUID
import kotlin.coroutines.resume

class TtsApi(context: Context) : BaseApi(context) {

    private var tts: TextToSpeech? = null
    private var isInitialized = false

    init {
        tts = TextToSpeech(context) { status ->
            isInitialized = status == TextToSpeech.SUCCESS
        }
    }

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        if (method != "POST") return methodNotAllowed(method)

        return when (path) {
            "/speak" -> speak(body)
            "/stop" -> stop()
            else -> ApiResponse.notFound()
        }
    }

    private suspend fun speak(body: String?): ApiResponse {
        if (!isInitialized) {
            return ApiResponse.error("TTS_NOT_AVAILABLE", "TTS engine not initialized")
        }

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

        val language = json["language"]?.jsonPrimitive?.content ?: "zh-CN"
        val pitch = json["pitch"]?.jsonPrimitive?.content?.toFloatOrNull() ?: 1.0f
        val rate = json["rate"]?.jsonPrimitive?.content?.toFloatOrNull() ?: 1.0f
        val queueMode = json["queueMode"]?.jsonPrimitive?.content ?: "flush"

        val locale = Locale.forLanguageTag(language)
        tts?.language = locale
        tts?.setPitch(pitch)
        tts?.setSpeechRate(rate)

        val utteranceId = UUID.randomUUID().toString()
        val queue = if (queueMode == "add") TextToSpeech.QUEUE_ADD else TextToSpeech.QUEUE_FLUSH

        val result = tts?.speak(text, queue, null, utteranceId)

        if (result != TextToSpeech.SUCCESS) {
            return ApiResponse.error("TTS_FAILED", "Failed to start speech")
        }

        val data = buildJsonObject {
            put("started", true)
            put("utteranceId", utteranceId)
        }
        return success(data)
    }

    private fun stop(): ApiResponse {
        tts?.stop()
        val data = buildJsonObject {
            put("stopped", true)
        }
        return success(data)
    }

    fun shutdown() {
        tts?.shutdown()
    }
}
