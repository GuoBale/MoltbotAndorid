package com.moltbot.bridge.api

import android.Manifest
import android.content.Context
import android.os.Build
import android.provider.MediaStore
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.*

class MediaApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        if (method != "GET") return methodNotAllowed(method)

        return when (path) {
            "/images" -> {
                checkMediaPermission("images")?.let { return it }
                listImages(params)
            }
            "/audio" -> {
                checkMediaPermission("audio")?.let { return it }
                listAudio(params)
            }
            "/video" -> {
                checkMediaPermission("video")?.let { return it }
                listVideo(params)
            }
            else -> ApiResponse.notFound()
        }
    }

    private fun checkMediaPermission(type: String): ApiResponse? {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val permission = when (type) {
                "images" -> Manifest.permission.READ_MEDIA_IMAGES
                "audio" -> Manifest.permission.READ_MEDIA_AUDIO
                "video" -> Manifest.permission.READ_MEDIA_VIDEO
                else -> return null
            }
            requirePermission(permission)
        } else {
            @Suppress("DEPRECATION")
            requirePermission(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun listImages(params: Map<String, String>): ApiResponse {
        val limit = params["limit"]?.toIntOrNull() ?: 100
        val offset = params["offset"]?.toIntOrNull() ?: 0
        val sortBy = params["sortBy"] ?: "date"
        val order = params["order"] ?: "desc"

        val sortColumn = when (sortBy) {
            "date" -> MediaStore.Images.Media.DATE_TAKEN
            "size" -> MediaStore.Images.Media.SIZE
            "name" -> MediaStore.Images.Media.DISPLAY_NAME
            else -> MediaStore.Images.Media.DATE_TAKEN
        }
        val sortOrder = if (order == "asc") "ASC" else "DESC"

        val images = mutableListOf<JsonObject>()
        var total = 0

        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.MIME_TYPE,
            MediaStore.Images.Media.SIZE,
            MediaStore.Images.Media.WIDTH,
            MediaStore.Images.Media.HEIGHT,
            MediaStore.Images.Media.DATE_TAKEN,
            MediaStore.Images.Media.RELATIVE_PATH
        )

        val cursor = context.contentResolver.query(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "$sortColumn $sortOrder"
        )

        cursor?.use {
            total = it.count
            var skipped = 0
            while (it.moveToNext()) {
                if (skipped < offset) {
                    skipped++
                    continue
                }
                if (images.size >= limit) break

                val id = it.getLong(0)
                val uri = "content://media/external/images/media/$id"

                images.add(buildJsonObject {
                    put("id", id.toString())
                    put("uri", uri)
                    put("displayName", it.getString(1) ?: "")
                    put("mimeType", it.getString(2) ?: "")
                    put("size", it.getLong(3))
                    put("width", it.getInt(4))
                    put("height", it.getInt(5))
                    put("dateTaken", it.getLong(6))
                    put("relativePath", it.getString(7) ?: "")
                })
            }
        }

        val data = buildJsonObject {
            put("images", JsonArray(images))
            put("total", total)
            put("limit", limit)
            put("offset", offset)
            put("hasMore", offset + images.size < total)
        }
        return success(data)
    }

    private fun listAudio(params: Map<String, String>): ApiResponse {
        val limit = params["limit"]?.toIntOrNull() ?: 100
        val offset = params["offset"]?.toIntOrNull() ?: 0

        val audio = mutableListOf<JsonObject>()
        var total = 0

        val projection = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.DISPLAY_NAME,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.SIZE,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.TITLE
        )

        val cursor = context.contentResolver.query(
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "${MediaStore.Audio.Media.DATE_ADDED} DESC"
        )

        cursor?.use {
            total = it.count
            var skipped = 0
            while (it.moveToNext()) {
                if (skipped < offset) {
                    skipped++
                    continue
                }
                if (audio.size >= limit) break

                val id = it.getLong(0)
                val uri = "content://media/external/audio/media/$id"

                audio.add(buildJsonObject {
                    put("id", id.toString())
                    put("uri", uri)
                    put("displayName", it.getString(1) ?: "")
                    put("mimeType", it.getString(2) ?: "")
                    put("size", it.getLong(3))
                    put("duration", it.getLong(4))
                    put("artist", it.getString(5) ?: "")
                    put("album", it.getString(6) ?: "")
                    put("title", it.getString(7) ?: "")
                })
            }
        }

        val data = buildJsonObject {
            put("audio", JsonArray(audio))
            put("total", total)
            put("limit", limit)
            put("offset", offset)
            put("hasMore", offset + audio.size < total)
        }
        return success(data)
    }

    private fun listVideo(params: Map<String, String>): ApiResponse {
        val limit = params["limit"]?.toIntOrNull() ?: 100
        val offset = params["offset"]?.toIntOrNull() ?: 0

        val videos = mutableListOf<JsonObject>()
        var total = 0

        val projection = arrayOf(
            MediaStore.Video.Media._ID,
            MediaStore.Video.Media.DISPLAY_NAME,
            MediaStore.Video.Media.MIME_TYPE,
            MediaStore.Video.Media.SIZE,
            MediaStore.Video.Media.DURATION,
            MediaStore.Video.Media.WIDTH,
            MediaStore.Video.Media.HEIGHT
        )

        val cursor = context.contentResolver.query(
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
            projection,
            null,
            null,
            "${MediaStore.Video.Media.DATE_ADDED} DESC"
        )

        cursor?.use {
            total = it.count
            var skipped = 0
            while (it.moveToNext()) {
                if (skipped < offset) {
                    skipped++
                    continue
                }
                if (videos.size >= limit) break

                val id = it.getLong(0)
                val uri = "content://media/external/video/media/$id"

                videos.add(buildJsonObject {
                    put("id", id.toString())
                    put("uri", uri)
                    put("displayName", it.getString(1) ?: "")
                    put("mimeType", it.getString(2) ?: "")
                    put("size", it.getLong(3))
                    put("duration", it.getLong(4))
                    put("width", it.getInt(5))
                    put("height", it.getInt(6))
                })
            }
        }

        val data = buildJsonObject {
            put("videos", JsonArray(videos))
            put("total", total)
            put("limit", limit)
            put("offset", offset)
            put("hasMore", offset + videos.size < total)
        }
        return success(data)
    }
}
