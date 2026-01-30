package com.moltbot.bridge.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.moltbot.bridge.BridgeApplication
import com.moltbot.bridge.MainActivity
import com.moltbot.bridge.R
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel

class BridgeService : Service() {

    companion object {
        const val NOTIFICATION_ID = 1
        const val ACTION_STOP = "com.moltbot.bridge.STOP"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var bridgeServer: BridgeServer? = null

    override fun onCreate() {
        super.onCreate()
        bridgeServer = BridgeServer(this, 18800)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, createNotification())
        bridgeServer?.start()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        bridgeServer?.stop()
        scope.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = PendingIntent.getService(
            this,
            0,
            Intent(this, BridgeService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, BridgeApplication.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_content))
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .setContentIntent(pendingIntent)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                getString(R.string.action_stop),
                stopIntent
            )
            .setOngoing(true)
            .build()
    }
}
