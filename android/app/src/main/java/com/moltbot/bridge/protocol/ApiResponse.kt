package com.moltbot.bridge.protocol

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
sealed class ApiResponse {

    @Serializable
    data class Success(
        val ok: Boolean = true,
        val data: JsonElement,
        val meta: Meta = Meta()
    ) : ApiResponse()

    @Serializable
    data class Error(
        val ok: Boolean = false,
        val error: ErrorBody,
        val meta: Meta = Meta()
    ) : ApiResponse()

    @Serializable
    data class Meta(
        val timestamp: Long = System.currentTimeMillis(),
        val durationMs: Long = 0
    )

    @Serializable
    data class ErrorBody(
        val code: String,
        val message: String,
        val details: JsonElement? = null
    )

    companion object {
        fun success(data: JsonElement): Success {
            return Success(data = data)
        }

        fun error(code: String, message: String): Error {
            return Error(error = ErrorBody(code = code, message = message))
        }

        fun permissionDenied(permission: String): Error {
            return Error(
                error = ErrorBody(
                    code = "PERMISSION_DENIED",
                    message = "需要 $permission 权限"
                )
            )
        }

        fun notFound(message: String = "Resource not found"): Error {
            return Error(error = ErrorBody(code = "NOT_FOUND", message = message))
        }

        fun invalidParams(message: String): Error {
            return Error(error = ErrorBody(code = "INVALID_PARAMS", message = message))
        }
    }
}
