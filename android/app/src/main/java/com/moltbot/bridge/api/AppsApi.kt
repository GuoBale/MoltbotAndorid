package com.moltbot.bridge.api

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import com.moltbot.bridge.protocol.ApiResponse
import kotlinx.serialization.json.*

class AppsApi(context: Context) : BaseApi(context) {

    override suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: String?
    ): ApiResponse {
        return when {
            method == "GET" && path.isEmpty() -> listApps(params)
            method == "GET" && path.startsWith("/") && path.indexOf('/', 1) < 0 -> {
                val packageName = path.removePrefix("/")
                getAppInfo(packageName)
            }
            method == "POST" && path == "/launch" -> launchApp(body)
            else -> ApiResponse.notFound()
        }
    }

    private fun listApps(params: Map<String, String>): ApiResponse {
        val type = params["type"] ?: "user"
        val query = params["q"]?.lowercase()

        val pm = context.packageManager
        val packages = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.getInstalledApplications(0)
        }

        val apps = packages
            .filter { appInfo ->
                when (type) {
                    "user" -> (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) == 0
                    "system" -> (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    else -> true
                }
            }
            .filter { appInfo ->
                if (query.isNullOrBlank()) true
                else {
                    val label = pm.getApplicationLabel(appInfo).toString().lowercase()
                    label.contains(query) || appInfo.packageName.lowercase().contains(query)
                }
            }
            .map { appInfo ->
                val packageInfo = try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        pm.getPackageInfo(appInfo.packageName, PackageManager.PackageInfoFlags.of(0))
                    } else {
                        @Suppress("DEPRECATION")
                        pm.getPackageInfo(appInfo.packageName, 0)
                    }
                } catch (e: Exception) {
                    null
                }

                buildJsonObject {
                    put("packageName", appInfo.packageName)
                    put("appName", pm.getApplicationLabel(appInfo).toString())
                    put("versionName", packageInfo?.versionName ?: "unknown")
                    put("versionCode", packageInfo?.let {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            it.longVersionCode
                        } else {
                            @Suppress("DEPRECATION")
                            it.versionCode.toLong()
                        }
                    } ?: 0L)
                    put("isSystemApp", (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0)
                    put("installedAt", packageInfo?.firstInstallTime ?: 0L)
                    put("updatedAt", packageInfo?.lastUpdateTime ?: 0L)
                }
            }

        val data = buildJsonObject {
            put("apps", JsonArray(apps))
            put("total", apps.size)
        }
        return success(data)
    }

    private fun getAppInfo(packageName: String): ApiResponse {
        val pm = context.packageManager

        val appInfo = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getApplicationInfo(packageName, 0)
            }
        } catch (e: PackageManager.NameNotFoundException) {
            return ApiResponse.notFound("App not found: $packageName")
        }

        val packageInfo = try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getPackageInfo(
                    packageName,
                    PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS.toLong())
                )
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            }
        } catch (e: Exception) {
            null
        }

        val data = buildJsonObject {
            put("packageName", appInfo.packageName)
            put("appName", pm.getApplicationLabel(appInfo).toString())
            put("versionName", packageInfo?.versionName ?: "unknown")
            put("versionCode", packageInfo?.let {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    it.longVersionCode
                } else {
                    @Suppress("DEPRECATION")
                    it.versionCode.toLong()
                }
            } ?: 0L)
            put("isSystemApp", (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0)
            put("targetSdkVersion", appInfo.targetSdkVersion)
            put("minSdkVersion", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                appInfo.minSdkVersion
            } else 0)
            put("permissions", JsonArray(
                (packageInfo?.requestedPermissions ?: emptyArray()).map { JsonPrimitive(it) }
            ))
            put("installedAt", packageInfo?.firstInstallTime ?: 0L)
            put("updatedAt", packageInfo?.lastUpdateTime ?: 0L)
            put("dataDir", appInfo.dataDir)
            put("apkPath", appInfo.sourceDir)
        }
        return success(data)
    }

    private fun launchApp(body: String?): ApiResponse {
        if (body.isNullOrBlank()) {
            return ApiResponse.invalidParams("Missing request body")
        }

        val json = try {
            Json.parseToJsonElement(body).jsonObject
        } catch (e: Exception) {
            return ApiResponse.invalidParams("Invalid JSON body")
        }

        val packageName = json["package"]?.jsonPrimitive?.contentOrNull
            ?: return ApiResponse.invalidParams("Missing 'package' field")

        val pm = context.packageManager
        var intent = pm.getLaunchIntentForPackage(packageName)

        if (intent == null) {
            // 部分应用 getLaunchIntentForPackage 返回 null，尝试显式解析 LAUNCHER Activity
            val mainIntent = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
                setPackage(packageName)
            }
            val resolveInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.resolveActivity(mainIntent, PackageManager.ResolveInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.resolveActivity(mainIntent, 0)
            }
            if (resolveInfo != null) {
                intent = Intent().apply {
                    setClassName(packageName, resolveInfo.activityInfo.name)
                }
            }
        }

        if (intent == null) {
            return ApiResponse.error("APP_LAUNCH_FAILED", "No launch intent for $packageName")
        }

        // 从后台/服务启动时需加以下 flag，才能把应用带到前台（否则可能只在后台启动）
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED or
            Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
        )

        return try {
            context.startActivity(intent)
            val data = buildJsonObject {
                put("launched", true)
                put("package", packageName)
                put("timestamp", System.currentTimeMillis())
            }
            success(data)
        } catch (e: Exception) {
            ApiResponse.error("APP_LAUNCH_FAILED", e.message ?: "Failed to launch app")
        }
    }
}
