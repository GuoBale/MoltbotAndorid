package com.moltbot.bridge.api

import android.Manifest
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.provider.CalendarContract
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.*
import java.util.TimeZone

class CalendarApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        return when {
            method == "GET" && path == "/events" -> {
                requirePermission(Manifest.permission.READ_CALENDAR)?.let { return it }
                listEvents(params)
            }
            method == "POST" && path == "/events" -> {
                requirePermission(Manifest.permission.WRITE_CALENDAR)?.let { return it }
                createEvent(body)
            }
            method == "DELETE" && path.startsWith("/events/") -> {
                requirePermission(Manifest.permission.WRITE_CALENDAR)?.let { return it }
                val eventId = path.removePrefix("/events/").trim()
                if (eventId.isNotEmpty()) deleteEvent(eventId) else ApiResponse.invalidParams("Missing event id")
            }
            method == "POST" && path == "/events/delete" -> {
                requirePermission(Manifest.permission.WRITE_CALENDAR)?.let { return it }
                deleteEventByBody(body)
            }
            method == "GET" && path == "/calendars" -> {
                requirePermission(Manifest.permission.READ_CALENDAR)?.let { return it }
                listCalendars()
            }
            else -> ApiResponse.notFound()
        }
    }

    private fun listCalendars(): ApiResponse {
        val calendars = mutableListOf<JsonObject>()

        val projection = arrayOf(
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.CALENDAR_COLOR,
            CalendarContract.Calendars.VISIBLE
        )

        val cursor = context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            null,
            null,
            null
        )

        cursor?.use {
            while (it.moveToNext()) {
                calendars.add(buildJsonObject {
                    put("id", it.getLong(0).toString())
                    put("displayName", it.getString(1) ?: "")
                    put("accountName", it.getString(2) ?: "")
                    put("accountType", it.getString(3) ?: "")
                    put("color", it.getInt(4))
                    put("visible", it.getInt(5) == 1)
                })
            }
        }

        val data = buildJsonObject {
            put("calendars", JsonArray(calendars))
        }
        return success(data)
    }

    private fun listEvents(params: Map<String, String>): ApiResponse {
        val startTime = params["startTime"]?.toLongOrNull() ?: (System.currentTimeMillis() - 86400000L)
        val endTime = params["endTime"]?.toLongOrNull() ?: (System.currentTimeMillis() + 86400000L * 30)
        val limit = params["limit"]?.toIntOrNull() ?: 100

        val events = mutableListOf<JsonObject>()

        val projection = arrayOf(
            CalendarContract.Events._ID,
            CalendarContract.Events.TITLE,
            CalendarContract.Events.DESCRIPTION,
            CalendarContract.Events.EVENT_LOCATION,
            CalendarContract.Events.DTSTART,
            CalendarContract.Events.DTEND,
            CalendarContract.Events.ALL_DAY,
            CalendarContract.Events.EVENT_TIMEZONE,
            CalendarContract.Events.CALENDAR_ID
        )

        val selection = "(${CalendarContract.Events.DTSTART} >= ?) AND (${CalendarContract.Events.DTSTART} <= ?)"
        val selectionArgs = arrayOf(startTime.toString(), endTime.toString())

        val cursor = context.contentResolver.query(
            CalendarContract.Events.CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            "${CalendarContract.Events.DTSTART} ASC"
        )

        cursor?.use {
            while (it.moveToNext() && events.size < limit) {
                val eventId = it.getLong(0)
                val calendarId = it.getLong(8)

                // 获取日历名称
                val calendarName = getCalendarName(calendarId)

                events.add(buildJsonObject {
                    put("id", eventId.toString())
                    put("title", it.getString(1) ?: "")
                    put("description", it.getString(2) ?: "")
                    put("location", it.getString(3) ?: "")
                    put("startTime", it.getLong(4))
                    put("endTime", it.getLong(5))
                    put("allDay", it.getInt(6) == 1)
                    put("timezone", it.getString(7) ?: TimeZone.getDefault().id)
                    put("calendarId", calendarId.toString())
                    put("calendarName", calendarName)
                })
            }
        }

        val data = buildJsonObject {
            put("events", JsonArray(events))
            put("total", events.size)
        }
        return success(data)
    }

    private fun createEvent(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val title = json["title"]?.jsonPrimitive?.contentOrNull
            ?: return ApiResponse.invalidParams("Missing 'title' field")
        val startTime = json["startTime"]?.jsonPrimitive?.longOrNull
            ?: return ApiResponse.invalidParams("Missing 'startTime' field")
        val endTime = json["endTime"]?.jsonPrimitive?.longOrNull
            ?: return ApiResponse.invalidParams("Missing 'endTime' field")
        val calendarId = json["calendarId"]?.jsonPrimitive?.contentOrNull
            ?: getDefaultCalendarId()
            ?: return ApiResponse.error("NO_CALENDAR", "No calendar available")

        val values = ContentValues().apply {
            put(CalendarContract.Events.CALENDAR_ID, calendarId.toLong())
            put(CalendarContract.Events.TITLE, title)
            put(CalendarContract.Events.DTSTART, startTime)
            put(CalendarContract.Events.DTEND, endTime)
            put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)

            json["description"]?.jsonPrimitive?.contentOrNull?.let {
                put(CalendarContract.Events.DESCRIPTION, it)
            }
            json["location"]?.jsonPrimitive?.contentOrNull?.let {
                put(CalendarContract.Events.EVENT_LOCATION, it)
            }
            json["allDay"]?.jsonPrimitive?.booleanOrNull?.let {
                put(CalendarContract.Events.ALL_DAY, if (it) 1 else 0)
            }
        }

        return try {
            val uri = context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
            val eventId = uri?.lastPathSegment

            val data = buildJsonObject {
                put("id", eventId ?: "")
                put("title", title)
                put("created", true)
            }
            success(data)
        } catch (e: Exception) {
            ApiResponse.error("CREATE_FAILED", e.message ?: "Failed to create event")
        }
    }

    private fun deleteEvent(eventId: String): ApiResponse {
        val id = eventId.toLongOrNull()
            ?: return ApiResponse.invalidParams("Invalid event id: $eventId")

        return try {
            val uri: Uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, id)
            val deleted = context.contentResolver.delete(uri, null, null)

            val data = buildJsonObject {
                put("deleted", deleted > 0)
                put("id", eventId)
                put("rowsAffected", deleted)
            }
            if (deleted > 0) success(data)
            else ApiResponse.error("NOT_FOUND", "Event not found or already deleted: $eventId")
        } catch (e: Exception) {
            ApiResponse.error("DELETE_FAILED", e.message ?: "Failed to delete event")
        }
    }

    private fun deleteEventByBody(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }
        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }
        val eventId = json["id"]?.jsonPrimitive?.contentOrNull
            ?: return ApiResponse.invalidParams("Missing 'id' field")
        return deleteEvent(eventId)
    }

    private fun getCalendarName(calendarId: Long): String {
        val cursor = context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            arrayOf(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME),
            "${CalendarContract.Calendars._ID} = ?",
            arrayOf(calendarId.toString()),
            null
        )
        cursor?.use {
            if (it.moveToFirst()) {
                return it.getString(0) ?: ""
            }
        }
        return ""
    }

    private fun getDefaultCalendarId(): String? {
        val cursor = context.contentResolver.query(
            CalendarContract.Calendars.CONTENT_URI,
            arrayOf(CalendarContract.Calendars._ID),
            "${CalendarContract.Calendars.VISIBLE} = 1",
            null,
            null
        )
        cursor?.use {
            if (it.moveToFirst()) {
                return it.getLong(0).toString()
            }
        }
        return null
    }
}
