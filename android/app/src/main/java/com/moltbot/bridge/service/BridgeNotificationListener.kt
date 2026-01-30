package com.moltbot.bridge.service

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * 通知监听服务
 * 需要用户在系统设置中手动启用
 */
class BridgeNotificationListener : NotificationListenerService() {

    companion object {
        private const val TAG = "NotificationListener"
        
        // 存储最近的通知，供 API 查询
        private val recentNotifications = mutableListOf<NotificationData>()
        private const val MAX_NOTIFICATIONS = 100

        fun getNotifications(): List<NotificationData> {
            return synchronized(recentNotifications) {
                recentNotifications.toList()
            }
        }

        fun clearNotifications() {
            synchronized(recentNotifications) {
                recentNotifications.clear()
            }
        }
    }

    data class NotificationData(
        val id: String,
        val packageName: String,
        val title: String?,
        val text: String?,
        val postTime: Long,
        val isClearable: Boolean
    )

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        Log.d(TAG, "Notification posted: ${sbn.packageName}")

        val notification = sbn.notification
        val extras = notification.extras

        val data = NotificationData(
            id = sbn.key,
            packageName = sbn.packageName,
            title = extras.getCharSequence("android.title")?.toString(),
            text = extras.getCharSequence("android.text")?.toString(),
            postTime = sbn.postTime,
            isClearable = sbn.isClearable
        )

        synchronized(recentNotifications) {
            recentNotifications.add(0, data)
            while (recentNotifications.size > MAX_NOTIFICATIONS) {
                recentNotifications.removeAt(recentNotifications.size - 1)
            }
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        Log.d(TAG, "Notification removed: ${sbn.packageName}")

        synchronized(recentNotifications) {
            recentNotifications.removeAll { it.id == sbn.key }
        }
    }
}
