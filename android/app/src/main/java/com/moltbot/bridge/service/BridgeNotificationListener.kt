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
        private const val MAX_NOTIFICATIONS = 100
        
        // 存储当前活动的通知
        private val notificationMap = HashMap<String, StatusBarNotification>()

        /**
         * 获取所有活动通知的 StatusBarNotification 对象
         */
        fun getNotifications(): List<StatusBarNotification> {
            synchronized(notificationMap) {
                return notificationMap.values.toList().sortedByDescending { it.postTime }
            }
        }

        /**
         * 获取简化的通知数据列表
         */
        fun getNotificationDataList(): List<NotificationData> {
            synchronized(notificationMap) {
                return notificationMap.values.map { sbn ->
                    val extras = sbn.notification.extras
                    NotificationData(
                        id = sbn.key,
                        packageName = sbn.packageName,
                        title = extras.getCharSequence("android.title")?.toString(),
                        text = extras.getCharSequence("android.text")?.toString(),
                        postTime = sbn.postTime,
                        isClearable = sbn.isClearable
                    )
                }.sortedByDescending { it.postTime }
            }
        }

        fun clearNotifications() {
            synchronized(notificationMap) {
                notificationMap.clear()
            }
        }
        
        internal fun addNotification(sbn: StatusBarNotification) {
            synchronized(notificationMap) {
                notificationMap[sbn.key] = sbn
                
                // 限制数量
                if (notificationMap.size > MAX_NOTIFICATIONS) {
                    val keysToRemove = notificationMap.entries
                        .sortedBy { it.value.postTime }
                        .take(notificationMap.size - MAX_NOTIFICATIONS)
                        .map { it.key }
                    keysToRemove.forEach { key -> notificationMap.remove(key) }
                }
            }
        }
        
        internal fun removeNotification(key: String) {
            synchronized(notificationMap) {
                notificationMap.remove(key)
            }
        }
        
        internal fun loadNotifications(notifications: Array<StatusBarNotification>?) {
            synchronized(notificationMap) {
                notificationMap.clear()
                notifications?.forEach { sbn ->
                    notificationMap[sbn.key] = sbn
                }
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
        addNotification(sbn)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
        removeNotification(sbn.key)
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "Notification listener connected")
        
        try {
            loadNotifications(activeNotifications)
            Log.i(TAG, "Loaded ${notificationMap.size} existing notifications")
        } catch (e: Exception) {
            Log.e(TAG, "Error loading existing notifications", e)
        }
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.i(TAG, "Notification listener disconnected")
    }
}
